import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: Fetch all pending user submissions (grants where scrapeJobId is null and approvedAt is null)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const submissions = await prisma.grant.findMany({
      where: {
        scrapeJobId: null, // User-submitted grants
        approvedAt: null, // Pending approval
      },
      select: {
        id: true,
        title: true,
        organization: true,
        amount: true,
        amountMin: true,
        amountMax: true,
        deadline: true,
        location: true,
        eligibility: true,
        description: true,
        applicationUrl: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: `Failed to fetch submissions: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST: Approve or reject a submission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { grantId, action } = body; // action: 'approve' or 'reject'

    if (!grantId || !action) {
      return NextResponse.json(
        { error: 'Missing grantId or action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Verify the grant exists and is a user submission
    const grant = await prisma.grant.findUnique({
      where: { id: grantId },
      select: {
        id: true,
        scrapeJobId: true,
        approvedAt: true,
      }
    });

    if (!grant) {
      return NextResponse.json(
        { error: 'Grant not found' },
        { status: 404 }
      );
    }

    if (grant.scrapeJobId !== null) {
      return NextResponse.json(
        { error: 'This grant was not submitted by a user' },
        { status: 400 }
      );
    }

    if (grant.approvedAt !== null) {
      return NextResponse.json(
        { error: 'This grant has already been reviewed' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id || session.user.email || 'unknown';

    if (action === 'approve') {
      // Approve the grant
      const updatedGrant = await prisma.grant.update({
        where: { id: grantId },
        data: {
          approvedAt: new Date(),
          approvedBy: userId,
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        grant: updatedGrant,
        message: 'Grant approved successfully'
      });
    } else {
      // Reject the grant (delete it)
      await prisma.grant.delete({
        where: { id: grantId }
      });

      return NextResponse.json({
        success: true,
        message: 'Grant rejected and deleted'
      });
    }
  } catch (error: any) {
    console.error('Error processing submission:', error);
    return NextResponse.json(
      { error: `Failed to process submission: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}










