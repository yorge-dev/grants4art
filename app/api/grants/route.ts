import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const categoriesParam = searchParams.get('categories');
    const tag = searchParams.get('tag');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter - includes tag search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          tags: {
            some: {
              tag: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { slug: { contains: search, mode: 'insensitive' } }
                ]
              }
            }
          }
        }
      ];
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Amount filters
    if (minAmount) {
      where.amountMin = { gte: parseInt(minAmount) };
    }
    if (maxAmount) {
      where.amountMax = { lte: parseInt(maxAmount) };
    }

    // Category filter (new)
    if (categoriesParam) {
      const categories = categoriesParam.split(',').filter(c => c.trim());
      if (categories.length > 0) {
        where.category = { in: categories };
      }
    }

    // Tag filter - support multiple tags (legacy/additional)
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      const tagSlugs = tagsParam.split(',').filter(t => t.trim());
      if (tagSlugs.length > 0) {
        where.tags = {
          some: {
            tag: {
              slug: {
                in: tagSlugs
              }
            }
          }
        };
      }
    } else if (tag) {
      // Support single tag for backward compatibility
      where.tags = {
        some: {
          tag: {
            slug: tag
          }
        }
      };
    }

    const [grants, total, allGrantsForAmount] = await Promise.all([
      prisma.grant.findMany({
        where,
        select: {
          id: true,
          title: true,
          organization: true,
          amount: true,
          amountMin: true,
          amountMax: true,
          deadline: true,
          location: true,
          description: true,
          eligibility: true,
          category: true,
          applicationUrl: true,
          discoveredAt: true,
          approvedAt: true,
          approvedBy: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: [
          { deadline: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.grant.count({ where }),
      // Fetch all grants matching the filter to calculate total amount
      prisma.grant.findMany({
        where,
        select: {
          amountMin: true,
          amountMax: true
        }
      })
    ]);

    // Calculate total award amount from all matching grants
    const totalAmount = allGrantsForAmount.reduce((sum, grant) => {
      let grantAmount = 0;
      if (grant.amountMin !== null && grant.amountMin !== undefined) {
        if (grant.amountMax !== null && grant.amountMax !== undefined) {
          grantAmount = (grant.amountMin + grant.amountMax) / 2;
        } else {
          grantAmount = grant.amountMin;
        }
      } else if (grant.amountMax !== null && grant.amountMax !== undefined) {
        grantAmount = grant.amountMax;
      }
      return sum + grantAmount;
    }, 0);

    return NextResponse.json({
      grants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        totalAmount
      }
    });
  } catch (error: any) {
    console.error('Error fetching grants:', error);
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Unknown error';
    
    // Check for common database connection errors
    if (errorMessage.includes("Can't reach database server")) {
      errorMessage = `Database connection failed. Please check your DATABASE_URL in .env.local and ensure the database is accessible. Original error: ${error.message}`;
    } else if (errorMessage.includes("does not exist") || errorMessage.includes("relation") || errorMessage.includes("table")) {
      errorMessage = `Database tables not found. Please run migrations: npm run db:migrate. Original error: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: `Failed to fetch grants: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const grant = await prisma.grant.create({
      data: {
        title: body.title,
        organization: body.organization,
        amount: body.amount,
        amountMin: body.amountMin,
        amountMax: body.amountMax,
        deadline: body.deadline ? new Date(body.deadline) : null,
        location: body.location,
        eligibility: body.eligibility,
        description: body.description,
        applicationUrl: body.applicationUrl,
        category: body.category,
        tags: body.tags ? {
          create: body.tags.map((tagName: string) => ({
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
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    return NextResponse.json(grant, { status: 201 });
  } catch (error: any) {
    console.error('Error creating grant:', error);
    return NextResponse.json(
      { error: `Failed to create grant: ${error.message}` },
      { status: 500 }
    );
  }
}
