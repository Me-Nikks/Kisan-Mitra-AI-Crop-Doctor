"use client";

import type { AppLanguage } from "@/types/diagnosis";

interface LanguageSelectorProps {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}

export default function LanguageSelector({
  language,
  onChange
}: LanguageSelectorProps) {
  return (
    <div className="flex gap-2">
      {[
        { label: "हिंदी", value: "hindi" as const },
        { label: "English", value: "english" as const }
      ].map((item) => {
        const isActive = language === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-green-800 text-white"
                : "bg-green-100 text-green-900 hover:bg-green-200"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
