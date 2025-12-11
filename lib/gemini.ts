import { GoogleGenerativeAI } from "@google/generative-ai";
import { ALLOWED_TAG_SLUGS, GRANT_TAGS } from "./constants";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey || apiKey === "your-gemini-api-key-here") {
  console.warn("GEMINI_API_KEY is not set or is still a placeholder. Gemini features will not work.");
  console.warn("   Please set GEMINI_API_KEY in your .env.local file");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Human readable mapping for the prompt based on GRANT_TAGS
const ALLOWED_TAGS_DESCRIPTION = GRANT_TAGS.map(tag => `- ${tag.name} (slug: ${tag.slug})`).join('\n');

export interface ExtractedGrantData {
  title: string;
  organization: string;
  amount?: string;
  amountMin?: number;
  amountMax?: number;
  deadline?: string;
  location: string;
  eligibility: string;
  description: string;
  applicationUrl?: string;
  tags: string[];
}

export async function extractGrantInfo(htmlContent: string, sourceUrl: string): Promise<ExtractedGrantData | null> {
  try {
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in .env.local");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Basic cleanup of HTML content to reduce token count and noise
    // Remove scripts, styles, and excessive whitespace
    const cleanHtml = htmlContent
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s+/g, " ")
      .substring(0, 25000); // Increased limit for better context

    const prompt = `
You are a grant information extraction assistant. Analyze the following webpage content and extract grant information for artists and designers in Texas.

Extract the following information if available:
- title: The name of the grant program
- organization: The organization offering the grant
- amount: The grant amount (as text, e.g., "$5,000" or "$1,000-$10,000")
- amountMin: Minimum amount as a number (if range)
- amountMax: Maximum amount as a number (if range)
- deadline: Application deadline (ISO date format if possible)
- location: Geographic location (city/region in Texas, or "Texas" if statewide)
- eligibility: Who can apply (detailed requirements)
- description: What the grant supports
- applicationUrl: Where to apply (use the source URL if no specific application URL)
- tags: Array of relevant tags from this specific list: ${ALLOWED_TAG_SLUGS.join(', ')}

Return ONLY a JSON object. If this page doesn't contain grant information, return null.

Source URL: ${sourceUrl}

Webpage Content:
${cleanHtml}

Response (JSON only):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const data = JSON.parse(jsonText);
    
    if (!data || data === null) {
      return null;
    }

    // Validate required fields
    if (!data.title || !data.organization || !data.location || !data.description) {
      return null;
    }

    return data as ExtractedGrantData;
  } catch (error: any) {
    console.error('Error extracting grant info:', error);
    
    // Provide helpful error messages
    if (error.message?.includes("API_KEY")) {
      console.error("   Please check your GEMINI_API_KEY in .env.local");
    } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
      console.error("   API quota exceeded. Check your Google Cloud Console.");
    }
    
    return null;
  }
}

export async function validateGrantData(grantData: ExtractedGrantData): Promise<boolean> {
  // Basic validation
  if (!grantData.title || !grantData.organization || !grantData.location || !grantData.description) {
    return false;
  }

  // Check if description is meaningful (not too short)
  if (grantData.description.length < 50) {
    return false;
  }

  // Check if location mentions Texas
  const locationLower = grantData.location.toLowerCase();
  if (!locationLower.includes('texas') && 
      !locationLower.includes('tx') &&
      !['houston', 'dallas', 'austin', 'san antonio', 'fort worth', 'el paso', 'arlington', 'corpus christi', 'plano', 'lubbock', 'denton'].some(city => locationLower.includes(city))) {
    return false;
  }

  return true;
}

export async function generateTagsFromGrant(description: string, eligibility: string): Promise<string[]> {
  try {
    if (!apiKey || apiKey === "your-gemini-api-key-here") {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in .env.local");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are a grant taxonomy assistant. Analyze the following grant description and eligibility requirements to identify relevant tags.
The tags MUST be selected ONLY from the following allowed list. Do not invent new tags.

Allowed Tags:
${ALLOWED_TAGS_DESCRIPTION}

Inputs:
- Description: ${description.substring(0, 2000)}
- Eligibility: ${eligibility.substring(0, 2000)}

Instructions:
1. Select up to 5 tags that best describe the grant.
2. Use ONLY the exact slugs provided in the allowed list (e.g., "visual-artists", "nonprofit").
3. If no tags are relevant, return an empty array.

Return ONLY a JSON object with a "tags" key containing an array of strings.

Response (JSON only):`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const data = JSON.parse(jsonText);
    
    if (!data || !Array.isArray(data.tags)) {
      return [];
    }

    // Filter to ensure only allowed tags are returned
    return data.tags
      .filter((tag: any) => typeof tag === 'string')
      .map((tag: string) => tag.toLowerCase().trim())
      .filter((tag: string) => ALLOWED_TAG_SLUGS.includes(tag));

  } catch (error: any) {
    console.error('Error generating tags:', error);
    
    // Provide helpful error messages
    if (error.message?.includes("API_KEY")) {
      console.error("   Please check your GEMINI_API_KEY in .env.local");
    }
    
    return [];
  }
}
