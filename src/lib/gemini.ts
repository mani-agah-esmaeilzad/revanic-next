// src/lib/gemini.ts

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

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

export async function translateArticleToEnglish(payload: TranslationRequest): Promise<TranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiTranslationError("Gemini API key is not configured.", 500);
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "You are a professional Persian to English literary translator.",
              "Translate the following article title and HTML content from Persian to natural, publication-ready English.",
              "Maintain the original HTML structure (including all tags and attributes) and only translate the visible text.",
              "Return the result strictly as a JSON object with the fields `title` and `content` (content must remain HTML).",
              "Do not wrap the JSON in markdown code fences.",
              "",
              `Title:\n${payload.title}`,
              "",
              "HTML Content:",
              payload.content,
            ].join("\n"),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
      },
    },
  };

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorPayload = await safeReadJson(response);
    throw new GeminiTranslationError(
      errorPayload?.error?.message || "Failed to translate article using Gemini.",
      response.status,
    );
  }

  const data = await safeReadJson(response);
  const textResponse =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.output ?? // fallback for different response shapes
    data?.text;

  if (typeof textResponse !== "string" || textResponse.trim().length === 0) {
    throw new GeminiTranslationError("Gemini translation response was empty or invalid.", 502);
  }

  try {
    const parsed = JSON.parse(textResponse) as TranslationResult;
    if (!parsed.title || !parsed.content) {
      throw new Error("Missing fields");
    }
    return parsed;
  } catch (error) {
    throw new GeminiTranslationError(
      "Gemini translation response could not be parsed. Try again later.",
      502,
    );
  }
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export { GeminiTranslationError };
