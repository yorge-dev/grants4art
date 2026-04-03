import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey === "") {
    console.error("GEMINI_API_KEY is not set or is still a placeholder!");
    console.error("Please update GEMINI_API_KEY in your .env.local file");
    console.error("\nTo get an API key:");
    console.error("1. Visit https://makersuite.google.com/app/apikey");
    console.error("2. Sign in with your Google account");
    console.error("3. Click 'Create API Key'");
    console.error("4. Copy the key to .env.local");
    process.exit(1);
  }

  console.log("GEMINI_API_KEY is set");
  console.log(`API Key length: ${apiKey.length} characters`);
  console.log(`API Key starts with: ${apiKey.substring(0, 10)}...`);

  try {
    console.log("\nTesting Gemini API connection...");
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model,
      contents: "Say 'Hello, Gemini is working!' in one sentence.",
    });

    const text = response.text ?? "";

    console.log("Gemini API is working!");
    console.log(`Response: ${text.trim()}`);
    console.log("\nYour Gemini integration is ready to use!");
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("\nError connecting to Gemini API:");
    
    if (err.message?.includes("API_KEY_INVALID")) {
      console.error("   The API key is invalid. Please check your GEMINI_API_KEY in .env.local");
    } else if (err.message?.includes("API_KEY_NOT_FOUND")) {
      console.error("   The API key was not found. Please set GEMINI_API_KEY in .env.local");
    } else if (err.message?.includes("quota") || err.message?.includes("limit")) {
      console.error("   API quota exceeded. Check your Google Cloud Console for usage limits.");
    } else {
      console.error(`   ${err.message || error}`);
    }
    
    process.exit(1);
  }
}

testGemini();
