import type { AppLanguage, DiagnosisResult } from "@/types/diagnosis";

interface DiagnoseInput {
  imageBase64?: string;
  description?: string;
  language: AppLanguage;
  cropType?: string;
  mediaType?: string;
}

const systemPrompt = `You are Kisan Mitra, an expert agricultural AI assistant for Indian farmers.
You diagnose crop diseases from photos and descriptions.

ALWAYS respond in valid JSON only. No markdown, no explanation outside JSON.

Your response must follow this exact structure:
{
  "crop_name": "string (identified plant/crop/tree common name in English)",
  "crop_name_hindi": "string (identified plant/crop/tree name in Hindi)",
  "disease_name": "string (common disease/problem name)",
  "disease_name_hindi": "string (Hindi disease name if known, else same as above)",
  "confidence": "high" | "medium" | "low",
  "severity": "mild" | "moderate" | "severe",
  "affected_part": "string (leaves/fruit/stem/roots/whole plant)",
  "cause": "string (fungal/bacterial/viral/pest/deficiency — brief explanation)",
  "cause_hindi": "string (same in Hindi)",
  "steps": [
    {
      "step": 1,
      "action": "string (English instruction)",
      "action_hindi": "string (Hindi instruction)",
      "product": "string or null (specific pesticide/fungicide name if applicable)",
      "dosage": "string or null (e.g. '2g per litre of water')"
    }
  ],
  "prevention": "string (one sentence prevention tip in English)",
  "prevention_hindi": "string (same in Hindi)",
  "urgency": "immediate" | "within_week" | "monitor",
  "not_sure": false
}

Important:
- Always include both "crop_name" and "disease_name".
- If exact crop is unclear, set crop_name to best guess like "Unknown crop" and crop_name_hindi to "अज्ञात फसल".
- If exact disease is unclear, provide best-guess disease and set not_sure=true with low confidence.

If the image is not of a crop or plant, return an error JSON:
{ "error": "Please upload a photo of a crop or plant." }

Keep Hindi text natural and simple — use words a rural farmer would understand,
not technical agricultural jargon.`;

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function diagnoseCrop({
  imageBase64,
  description,
  language,
  cropType,
  mediaType = "image/jpeg"
}: DiagnoseInput): Promise<DiagnosisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];

  if (imageBase64) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${mediaType};base64,${imageBase64}`
      }
    });
  }

  content.push({
    type: "text",
    text: description
      ? `Language preference: ${language}. Crop selected by farmer: ${cropType || "unknown"}. Farmer describes: "${description}". Diagnose and respond in JSON.`
      : `Language preference: ${language}. Crop selected by farmer: ${cropType || "unknown"}. Diagnose the crop disease in this image. Respond in JSON only.`
  });

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const contentText = json.choices?.[0]?.message?.content;
  if (!contentText) {
    throw new Error("Unexpected response format from Groq API.");
  }

  const parsed = JSON.parse(contentText) as Partial<DiagnosisResult>;

  return {
    crop_name: parsed.crop_name || (cropType ? cropType : "Unknown crop"),
    crop_name_hindi: parsed.crop_name_hindi || (cropType ? cropType : "अज्ञात फसल"),
    disease_name: parsed.disease_name || "Unknown disease",
    disease_name_hindi: parsed.disease_name_hindi || parsed.disease_name || "अज्ञात रोग",
    confidence: parsed.confidence || "low",
    severity: parsed.severity || "moderate",
    affected_part: parsed.affected_part || "whole plant",
    cause: parsed.cause || "Unknown",
    cause_hindi: parsed.cause_hindi || "अज्ञात",
    steps: parsed.steps || [],
    prevention: parsed.prevention || "Monitor crop condition and consult local expert.",
    prevention_hindi: parsed.prevention_hindi || "फसल की निगरानी करें और नजदीकी कृषि विशेषज्ञ से सलाह लें।",
    urgency: parsed.urgency || "monitor",
    not_sure: parsed.not_sure ?? true,
    error: parsed.error
  };
}
