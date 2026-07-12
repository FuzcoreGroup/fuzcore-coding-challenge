/**
 * Gemini AI client for category selection based on transaction description
 * Requires GEMINI_API_KEY env variable
 */

import { serverConfig } from "../config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = serverConfig.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function selectCategoryFromDescription(
  description: string,
  categories: string[],
): Promise<string | null> {
  if (!genAI) {
    console.warn("GEMINI_API_KEY not configured, returning null");
    return null;
  }

  if (!description || !categories.length) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a financial assistant.

Pick the most appropriate category for this transaction.

Transaction: "${description}"

Available categories:
${categories.join(", ")}

Rules:
- Only return ONE category name
- Must be from the list above (case sensitive)
- No explanation, no quotes, just the category name
- If no category fits, return the first category in the list

Answer:
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Check if the returned category is in our list
    if (categories.includes(text)) {
      return text;
    }

    // If not found, return the first category as fallback
    console.warn(`AI returned invalid category "${text}", using fallback`);
    return categories[0];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return categories[0]; // Fallback to first category
  }
}
