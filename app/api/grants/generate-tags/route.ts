import { NextRequest, NextResponse } from "next/server";
import { generateTagsFromGrant } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, eligibility } = body;

    if (!description || !eligibility) {
      return NextResponse.json(
        { error: "Description and eligibility are required" },
        { status: 400 }
      );
    }

    const tags = await generateTagsFromGrant(description, eligibility);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error generating tags:", error);
    return NextResponse.json(
      { error: "Failed to generate tags" },
      { status: 500 }
    );
  }
}


