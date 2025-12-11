import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    if (!params?.id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    await prisma.grantSource.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    if (!params?.id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    const source = await prisma.grantSource.update({
      where: { id: params.id },
      data: { isActive }
    });

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}
