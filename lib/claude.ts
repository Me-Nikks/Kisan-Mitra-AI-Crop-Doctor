import Anthropic from "@anthropic-ai/sdk";
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function diagnoseCrop({
  imageBase64,
  description,
  language,
  cropType,
  mediaType = "image/jpeg"
}: DiagnoseInput): Promise<DiagnosisResult> {
  const content: Anthropic.MessageParam["content"] = [];

  if (imageBase64) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: imageBase64
      }
    });
  }

  content.push({
    type: "text",
    text: description
      ? `Language preference: ${language}. Crop: ${cropType || "unknown"}. Farmer describes: "${description}". Diagnose and respond in JSON.`
      : `Language preference: ${language}. Crop: ${cropType || "unknown"}. Diagnose the crop disease in this image. Respond in JSON only.`
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content }]
  });

  const firstBlock = response.content[0];
  if (!firstBlock || firstBlock.type !== "text") {
    throw new Error("Unexpected response format from Claude API");
  }

  return JSON.parse(firstBlock.text) as DiagnosisResult;
}
