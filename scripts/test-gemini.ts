import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key-here" || apiKey === "") {
    console.error("❌ GEMINI_API_KEY is not set or is still a placeholder!");
    console.error("Please update GEMINI_API_KEY in your .env.local file");
    console.error("\nTo get an API key:");
    console.error("1. Visit https://makersuite.google.com/app/apikey");
    console.error("2. Sign in with your Google account");
    console.error("3. Click 'Create API Key'");
    console.error("4. Copy the key to .env.local");
    process.exit(1);
  }

  console.log("✓ GEMINI_API_KEY is set");
  console.log(`✓ API Key length: ${apiKey.length} characters`);
  console.log(`✓ API Key starts with: ${apiKey.substring(0, 10)}...`);

  try {
    console.log("\n🔍 Testing Gemini API connection...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Simple test prompt
    const result = await model.generateContent("Say 'Hello, Gemini is working!' in one sentence.");
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini API is working!");
    console.log(`📝 Response: ${text.trim()}`);
    console.log("\n🎉 Your Gemini integration is ready to use!");
  } catch (error: any) {
    console.error("\n❌ Error connecting to Gemini API:");
    
    if (error.message?.includes("API_KEY_INVALID")) {
      console.error("   The API key is invalid. Please check your GEMINI_API_KEY in .env.local");
    } else if (error.message?.includes("API_KEY_NOT_FOUND")) {
      console.error("   The API key was not found. Please set GEMINI_API_KEY in .env.local");
    } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
      console.error("   API quota exceeded. Check your Google Cloud Console for usage limits.");
    } else {
      console.error(`   ${error.message || error}`);
    }
    
    process.exit(1);
  }
}

testGemini();

