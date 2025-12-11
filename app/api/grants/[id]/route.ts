import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const grant = await prisma.grant.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!grant) {
      return NextResponse.json(
        { error: 'Grant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(grant);
  } catch (error) {
    console.error('Error fetching grant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grant' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Handle tags separately if provided
    const { tags, status, ...updateData } = body;
    
    // Convert deadline to Date if provided
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline);
    }

    const grant = await prisma.grant.update({
      where: { id },
      data: {
        ...updateData,
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map((tagName: string) => ({
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
          }
        })
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    return NextResponse.json(grant);
  } catch (error) {
    console.error('Error updating grant:', error);
    return NextResponse.json(
      { error: 'Failed to update grant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.grant.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grant:', error);
    return NextResponse.json(
      { error: 'Failed to delete grant' },
      { status: 500 }
    );
  }
}

