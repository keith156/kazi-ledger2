
import { AIResponse } from "./types.ts";

export const parseNaturalLanguage = async (input: string, context: string): Promise<AIResponse> => {
  try {
    const response = await fetch("/api/gemini/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, context }),
    });
    if (!response.ok) {
      throw new Error("Failed to parse natural language");
    }
    return await response.json();
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
};

export const analyzeReceipt = async (base64Image: string): Promise<AIResponse> => {
  try {
    const response = await fetch("/api/gemini/analyzeReceipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image }),
    });
    if (!response.ok) {
      throw new Error("Failed to analyze receipt");
    }
    return await response.json();
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    throw error;
  }
};

export const generateInsights = async (context: string): Promise<string[]> => {
  try {
    const response = await fetch("/api/gemini/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    if (!response.ok) {
      throw new Error("Failed to generate insights");
    }
    return await response.json();
  } catch (error) {
    return ["Daily sales help growth.", "Track debt consistently.", "Monitor your weekly totals."];
  }
};