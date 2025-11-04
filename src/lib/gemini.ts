// src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

interface TranslationRequest {
  title: string;
  content: string;
}

export interface TranslationResult {
  title: string;
  content: string;
}

class GeminiTranslationError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiTranslationError";
    this.status = status;
  }
}

export const GLOSSARY_NOTICE =
  "این مقاله به کمک هوش مصنوعی Gemini ترجمه شده است و ممکن است شامل خطاهای جزئی باشد.";

const TRANSLATION_SYSTEM_PROMPT = [
  "You are a professional Persian to English literary translator.",
  "Translate the provided article title and HTML content from Persian to natural, publication-ready English.",
  "Preserve all HTML structure (tags, attributes, inline elements) and translate only the visible text.",
  "Return the result strictly as a JSON object with two string fields: `title` and `content`.",
  "Do not include markdown fences or additional commentary.",
].join("\n");

const CODE_FENCE_REGEX = /```(?:json)?|```/gi;

const jsonCleanup = (raw: string) => raw.replace(CODE_FENCE_REGEX, "").trim();

export async function translateArticleToEnglish(payload: TranslationRequest): Promise<TranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiTranslationError("Gemini API key is not configured.", 500);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const userPrompt = [
      TRANSLATION_SYSTEM_PROMPT,
      "",
      `Title:\n${payload.title}`,
      "",
      "HTML Content:",
      payload.content,
    ].join("\n");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.2,
      },
    });

    const rawText = result.response.text();
    const cleaned = jsonCleanup(rawText);

    if (!cleaned) {
      throw new GeminiTranslationError("Gemini translation response was empty or invalid.", 502);
    }

    const parsed = JSON.parse(cleaned) as TranslationResult;

    if (!parsed.title || !parsed.content) {
      throw new GeminiTranslationError("Gemini response was missing required fields.", 502);
    }

    return parsed;
  } catch (error) {
    if (error instanceof GeminiTranslationError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new GeminiTranslationError("Gemini translation response could not be parsed. Try again later.", 502);
    }

    const message = error instanceof Error ? error.message : "Unexpected Gemini client error.";
    throw new GeminiTranslationError(message, 502);
  }
}

export { GeminiTranslationError };
