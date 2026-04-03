import { GoogleGenAI } from "@google/genai";
import { ALLOWED_TAG_SLUGS, GRANT_TAGS } from "./constants";

const apiKey = process.env.GEMINI_API_KEY || "";

/** Stable model id; override with GEMINI_MODEL if Google renames endpoints. */
const GEMINI_TEXT_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

/** After stripping head noise, many CMS pages still need 50k+ chars to reach the main article. */
const SCRAPE_HTML_MAX_CHARS = Math.min(
  Math.max(15000, Number(process.env.SCRAPE_HTML_MAX_CHARS) || 90000),
  200000
);

function extractHeadSummary(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/im);
  const title = titleMatch
    ? titleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";
  const descMatch =
    html.match(
      /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i
    );
  const desc = descMatch?.[1]?.replace(/\s+/g, " ").trim() || "";
  const parts: string[] = [];
  if (title) parts.push(`title: ${title}`);
  if (desc) parts.push(`meta description: ${desc}`);
  return parts.join(" | ");
}

/**
 * Large pages often put 20k+ characters in <head> (fonts, scripts, meta). The first 15k of raw
 * HTML can omit <body> entirely. Prefer body markup and a higher cap so the model sees real copy.
 */
function prepareHtmlForGrantExtraction(html: string): string {
  const headHint = extractHeadSummary(html);
  let core = html;
  const headEnd = core.search(/<\/head>/i);
  if (headEnd !== -1) {
    core = core.slice(headEnd + "</head>".length);
  }
  const bodyMatch = core.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    core = bodyMatch[1];
  }

  const stripped = core
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gim, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const prefix = headHint ? `[Page hint] ${headHint}\n\n` : "";
  return (prefix + stripped).slice(0, SCRAPE_HTML_MAX_CHARS);
}

if (!apiKey || apiKey === "your-gemini-api-key-here") {
  console.warn("GEMINI_API_KEY is not set or is still a placeholder. Gemini features will not work.");
  console.warn("   Please set GEMINI_API_KEY in your .env.local file");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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

function parseJsonFromModelResponse(raw: string): unknown {
  let jsonText = raw.trim();
  const fence = jsonText.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (fence) {
    jsonText = fence[1].trim();
  } else if (jsonText.startsWith("```json")) {
    jsonText = jsonText.replace(/^```json\s*/i, "").replace(/\s*```\s*$/m, "");
  } else if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```\s*/m, "").replace(/\s*```\s*$/m, "");
  }

  try {
    return JSON.parse(jsonText);
  } catch {
    const start = jsonText.indexOf("{");
    const end = jsonText.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(jsonText.slice(start, end + 1));
    }
    throw new Error("Could not parse JSON from model response");
  }
}

export async function extractGrantInfo(htmlContent: string, sourceUrl: string): Promise<ExtractedGrantData | null> {
  if (!apiKey || apiKey === "your-gemini-api-key-here" || !ai) {
    throw new Error("GEMINI_API_KEY is not configured. Please set it in .env.local");
  }

  const cleanHtml = prepareHtmlForGrantExtraction(htmlContent);

  const prompt = `
You are a funding-opportunity extraction assistant. Analyze the webpage content and extract structured information about grants, fellowships, prizes, pitch competitions, accelerator funds, sponsorships, or other non-dilutive funding (including entrepreneur or small-business programs like pitch contests with cash awards).

Include opportunities for artists, designers, creatives, AND broader community or business programs when the page clearly describes how to apply for funding or a competition award. Do not return null solely because the program targets entrepreneurs instead of only visual artists.

Extract the following information if available:
- title: The name of the grant program
- organization: The organization offering the grant
- amount: The grant amount (as text, e.g., "$5,000" or "$1,000-$10,000")
- amountMin: Minimum amount as a number (if range)
- amountMax: Maximum amount as a number (if range)
- deadline: Application deadline (ISO date format if possible)
- location: Geographic scope (e.g. city, state, "Texas", "United States", or "United States (Texas residents eligible)" when nationwide)
- eligibility: Who can apply (bullet list when multiple criteria; if unclear, summarize what the page states)
- description: What the grant supports (2-3 sentences or bullet points, max 400 words)
- applicationUrl: Where to apply (use the source URL if no specific application URL)
- tags: Array of relevant tags from this specific list only: ${ALLOWED_TAG_SLUGS.join(", ")}

Rules:
- Return ONLY valid JSON: a single object with the fields above, or the JSON literal null (no markdown, no commentary).
- If this page is not about applying for funding, a competition award, or a similar opportunity, return null.

Source URL: ${sourceUrl}

Webpage Content:
${cleanHtml}`;

  let text: string;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    text = response.text?.trim() ?? "";
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error extracting grant info (Gemini request):", error);
    if (err.message?.includes("API_KEY")) {
      console.error("   Please check your GEMINI_API_KEY in .env.local");
    } else if (err.message?.includes("quota") || err.message?.includes("limit")) {
      console.error("   API quota exceeded. Check your Google Cloud Console.");
    }
    throw error;
  }

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  let data: unknown;
  try {
    data = parseJsonFromModelResponse(text);
  } catch (e) {
    console.error("Gemini response was not valid JSON:", text.slice(0, 500));
    throw e instanceof Error ? e : new Error("Could not parse Gemini response");
  }

  if (!data || data === null || typeof data !== "object") {
    return null;
  }

  const row = data as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const organization = typeof row.organization === "string" ? row.organization.trim() : "";
  const location = typeof row.location === "string" ? row.location.trim() : "";
  const description = typeof row.description === "string" ? row.description.trim() : "";
  const eligibility =
    typeof row.eligibility === "string" ? row.eligibility.trim() : "";

  if (!title || !organization || !location || !description) {
    return null;
  }

  const tags = Array.isArray(row.tags)
    ? row.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.toLowerCase().trim())
        .filter((t) => ALLOWED_TAG_SLUGS.includes(t))
    : [];

  return {
    title,
    organization,
    amount: typeof row.amount === "string" ? row.amount : undefined,
    amountMin: typeof row.amountMin === "number" ? row.amountMin : undefined,
    amountMax: typeof row.amountMax === "number" ? row.amountMax : undefined,
    deadline: typeof row.deadline === "string" ? row.deadline : undefined,
    location,
    eligibility,
    description,
    applicationUrl: typeof row.applicationUrl === "string" ? row.applicationUrl.trim() : undefined,
    tags,
  };
}

export async function validateGrantData(grantData: ExtractedGrantData): Promise<boolean> {
  if (!grantData.title || !grantData.organization || !grantData.location || !grantData.description) {
    return false;
  }

  if (grantData.description.trim().length < 30) {
    return false;
  }

  if (grantData.location.trim().length < 2) {
    return false;
  }

  return true;
}

export async function generateTagsFromGrant(description: string, eligibility: string): Promise<string[]> {
  try {
    if (!apiKey || apiKey === "your-gemini-api-key-here" || !ai) {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in .env.local");
    }

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

    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });

    const text = (response as { text?: string }).text ?? "";
    
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

    return data.tags
      .filter((tag: unknown): tag is string => typeof tag === 'string')
      .map((tag: string) => tag.toLowerCase().trim())
      .filter((tag: string) => ALLOWED_TAG_SLUGS.includes(tag));

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error generating tags:', error);
    
    if (err.message?.includes("API_KEY")) {
      console.error("   Please check your GEMINI_API_KEY in .env.local");
    }
    
    return [];
  }
}
