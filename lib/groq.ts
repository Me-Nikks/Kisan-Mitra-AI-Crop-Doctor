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
  "disease_name": "string (common name)",
  "disease_name_hindi": "string (Hindi name if known, else same as above)",
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

If you cannot determine the disease from the image/description, set "not_sure": true and still
fill in your best guess with low confidence.
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
      ? `Language preference: ${language}. Crop: ${cropType || "unknown"}. Farmer describes: "${description}". Diagnose and respond in JSON.`
      : `Language preference: ${language}. Crop: ${cropType || "unknown"}. Diagnose the crop disease in this image. Respond in JSON only.`
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

  return JSON.parse(contentText) as DiagnosisResult;
}
