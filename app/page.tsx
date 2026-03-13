"use client";

import { useEffect, useMemo, useState } from "react";
import DiagnosisResult from "@/components/DiagnosisResult";
import ImageUploader from "@/components/ImageUploader";
import LanguageSelector from "@/components/LanguageSelector";
import VoiceInput from "@/components/VoiceInput";
import type { AppLanguage, DiagnosisResult as DiagnosisResultType } from "@/types/diagnosis";

type Status = "idle" | "loading" | "result";

const crops = [
  "गेहूं (Wheat)",
  "टमाटर (Tomato)",
  "प्याज (Onion)",
  "आलू (Potato)",
  "धान (Rice)",
  "मक्का (Maize)",
  "कपास (Cotton)",
  "सोयाबीन (Soybean)",
  "गन्ना (Sugarcane)"
];

export default function HomePage() {
  const [language, setLanguage] = useState<AppLanguage>("hindi");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DiagnosisResultType | null>(null);
  const [requestTimedOut, setRequestTimedOut] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(imageFile) || Boolean(description.trim()),
    [imageFile, description]
  );

  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    const timeout = setTimeout(() => {
      setRequestTimedOut(true);
    }, 15000);

    return () => clearTimeout(timeout);
  }, [status]);

  const readImageAsBase64 = async (file: File) => {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return dataUrl.split(",")[1] ?? "";
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setImageError("Only JPEG, PNG, and WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("File size must be under 5MB.");
      return;
    }

    setImageError(null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const runDiagnosis = async () => {
    if (!canSubmit || status === "loading") {
      return;
    }

    setStatus("loading");
    setRequestTimedOut(false);

    try {
      const imageBase64 = imageFile ? await readImageAsBase64(imageFile) : undefined;
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          description,
          language,
          cropType: selectedCrop || undefined,
          mediaType: imageFile?.type
        })
      });

      const data = (await response.json()) as DiagnosisResultType;
      setResult(data);
      setStatus("result");
    } catch {
      setResult({ error: "Network error. Please retry.", not_sure: true } as DiagnosisResultType);
      setStatus("result");
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6">
      <header className="rounded-xl bg-green-800 p-6 text-white">
        <h1 className="text-3xl font-bold">🌾 Kisan Mitra</h1>
        <p className="mt-2 text-green-100">Fasal Doctor — AI se paye apni fasal ka ilaaj</p>
      </header>

      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm space-y-5">
        <LanguageSelector language={language} onChange={setLanguage} />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {crops.map((crop) => {
            const active = selectedCrop === crop;
            return (
              <button
                key={crop}
                type="button"
                onClick={() => setSelectedCrop(active ? "" : crop)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                  active
                    ? "bg-green-800 text-white"
                    : "bg-green-100 text-green-900 hover:bg-green-200"
                }`}
              >
                {crop}
              </button>
            );
          })}
        </div>

        <ImageUploader
          previewUrl={previewUrl}
          onFileSelect={handleFileSelect}
          onRemove={removeImage}
          error={imageError}
        />

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Problem Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-green-600 focus:outline-none"
            placeholder="अपनी फसल की समस्या बताएं... (e.g. पत्ते पीले हो रहे हैं, फल सड़ रहे हैं)"
          />
          <VoiceInput language={language} onTranscript={(text) => setDescription((prev) => `${prev} ${text}`.trim())} />
        </div>

        <div>
          <button
            type="button"
            disabled={!canSubmit || status === "loading"}
            title={!canSubmit ? "Upload image or add description first" : ""}
            onClick={runDiagnosis}
            className="inline-flex items-center rounded-xl bg-green-800 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-green-300"
          >
            {status === "loading" ? "⏳ AI जांच कर रहा है..." : "🔍 Diagnose / जांच करें"}
          </button>

          {requestTimedOut && status === "loading" && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              Request is taking longer than usual.
              <button
                className="ml-2 underline"
                type="button"
                onClick={runDiagnosis}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {status === "result" && result ? (
        <section className="mt-6">
          <DiagnosisResult data={result} language={language} />
        </section>
      ) : null}
    </main>
  );
}
