import { NextResponse } from "next/server";
import { diagnoseCrop } from "@/lib/claude";
import type { AppLanguage } from "@/types/diagnosis";

interface DiagnoseRequestBody {
  imageBase64?: string;
  description?: string;
  language?: AppLanguage;
  cropType?: string;
  mediaType?: string;
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as DiagnoseRequestBody;
    const imageBase64 = body.imageBase64?.trim();
    const description = body.description?.trim();
    const language = body.language ?? "hindi";

    if (!imageBase64 && !description) {
      return NextResponse.json(
        { error: "Please upload an image or describe the crop issue." },
        { status: 400 }
      );
    }

    const result = await diagnoseCrop({
      imageBase64,
      description,
      language,
      cropType: body.cropType,
      mediaType: body.mediaType
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to diagnose crop disease. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
