import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractGrantInfo, validateGrantData } from "@/lib/gemini";
import { ScrapeJobStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { sourceUrl, sourceId } = body;

    let grantSourceId: string | undefined;

    if (sourceId) {
      const source = await prisma.grantSource.findUnique({
        where: { id: sourceId }
      });
      if (!source) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }
      sourceUrl = source.url;
      grantSourceId = source.id;
    } else if (sourceUrl) {
      // Try to find existing source by URL
      const source = await prisma.grantSource.findUnique({
        where: { url: sourceUrl }
      });
      if (source) {
        grantSourceId = source.id;
      }
    }

    if (!sourceUrl) {
      return NextResponse.json(
        { error: 'Source URL is required' },
        { status: 400 }
      );
    }

    // Create scrape job
    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        sourceUrl,
        status: ScrapeJobStatus.PENDING,
        grantSourceId
      }
    });

    // Start scraping (in production, this should be a background job)
    // For now, we'll do it synchronously
    try {
      // Update status to RUNNING
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: ScrapeJobStatus.RUNNING }
      });

      // Fetch the webpage
      const response = await fetch(sourceUrl);
      const htmlContent = await response.text();

      // Extract grant information using Gemini
      const extractedData = await extractGrantInfo(htmlContent, sourceUrl);

      if (extractedData && await validateGrantData(extractedData)) {
        // Create grant with PENDING status
        const grant = await prisma.grant.create({
          data: {
            title: extractedData.title,
            organization: extractedData.organization,
            amount: extractedData.amount,
            amountMin: extractedData.amountMin,
            amountMax: extractedData.amountMax,
            deadline: extractedData.deadline ? new Date(extractedData.deadline) : null,
            location: extractedData.location,
            eligibility: extractedData.eligibility,
            description: extractedData.description,
            applicationUrl: extractedData.applicationUrl || sourceUrl,
            scrapeJobId: scrapeJob.id,
            tags: extractedData.tags ? {
              create: extractedData.tags.map((tagName: string) => ({
                tag: {
                  connectOrCreate: {
                    where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
                    create: {
                      name: tagName,
                      slug: tagName.toLowerCase().replace(/\s+/g, '-')
                    }
                  }
                }
              }))
            } : undefined
          }
        });

        // Update scrape job
        await prisma.scrapeJob.update({
          where: { id: scrapeJob.id },
          data: {
            status: ScrapeJobStatus.COMPLETED,
            discoveredCount: 1,
            completedAt: new Date()
          }
        });

        // Update grant source last scraped time
        if (grantSourceId) {
          await prisma.grantSource.update({
            where: { id: grantSourceId },
            data: { lastScraped: new Date() }
          });
        }

        return NextResponse.json({
          success: true,
          scrapeJob: {
            id: scrapeJob.id,
            status: ScrapeJobStatus.COMPLETED
          },
          grant: {
            id: grant.id,
            title: grant.title
          }
        });
      } else {
        // No valid grant found
        await prisma.scrapeJob.update({
          where: { id: scrapeJob.id },
          data: {
            status: ScrapeJobStatus.COMPLETED,
            discoveredCount: 0,
            completedAt: new Date(),
            errorMessage: 'No valid grant information found'
          }
        });

        return NextResponse.json({
          success: false,
          message: 'No valid grant information found on this page'
        });
      }
    } catch (error) {
      // Update scrape job as FAILED
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: ScrapeJobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  } catch (error) {
    console.error('Error in scrape job:', error);
    return NextResponse.json(
      { error: 'Failed to process scrape job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.scrapeJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          grants: {
            include: {
              tags: {
                include: {
                  tag: true
                }
              }
            }
          },
          grantSource: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.scrapeJob.count()
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching scrape jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scrape jobs' },
      { status: 500 }
    );
  }
}

