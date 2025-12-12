import { GoogleGenAI, Type } from "@google/genai";

/**
 * Detects speech bubbles and translates them using Gemini 2.5 Flash with structured output.
 */
export const translateComicPage = async (
  base64Image: string,
  sourceLang: string,
  targetLang: string,
  apiKey?: string,
  onProgress?: (msg: string) => void
): Promise<import("../types").Bubble[]> => {
  
  if (onProgress) onProgress("Initializing AI...");

  try {
    const finalApiKey = apiKey || process.env.API_KEY;
    if (!finalApiKey) {
      throw new Error("Missing API Key. Please provide your Google Gemini API Key in the settings.");
    }

    const ai = new GoogleGenAI({ apiKey: finalApiKey });

    const sourceText = sourceLang === 'auto' ? "the original language" : sourceLang;
    
    // Clean base64
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';

    if (onProgress) onProgress("Detecting & Translating bubbles...");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `You are a comic translator. 
            1. Detect all speech bubbles and narration boxes in the image.
            2. For each bubble, identify the bounding box of the bubble itself (ymin, xmin, ymax, xmax on a 0-1000 scale).
            3. Translate the text inside the bubble from ${sourceText} to ${targetLang}.
            Return the result as a JSON list.`,
          },
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bubbles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  coordinates: {
                    type: Type.OBJECT,
                    properties: {
                      ymin: { type: Type.INTEGER, description: "Top coordinate (0-1000)" },
                      xmin: { type: Type.INTEGER, description: "Left coordinate (0-1000)" },
                      ymax: { type: Type.INTEGER, description: "Bottom coordinate (0-1000)" },
                      xmax: { type: Type.INTEGER, description: "Right coordinate (0-1000)" },
                    },
                    required: ["ymin", "xmin", "ymax", "xmax"],
                  },
                  translatedText: { type: Type.STRING, description: "The translated text" },
                },
                required: ["coordinates", "translatedText"],
              },
            },
          },
        },
      },
    });

    if (onProgress) onProgress("Formatting results...");

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data received from Gemini.");

    const parsed = JSON.parse(jsonText);
    return parsed.bubbles || [];

  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw error;
  }
};