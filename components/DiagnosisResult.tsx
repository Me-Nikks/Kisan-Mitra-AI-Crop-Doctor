import type { AppLanguage, DiagnosisResult as DiagnosisResultType } from "@/types/diagnosis";

interface DiagnosisResultProps {
  data: DiagnosisResultType;
  language: AppLanguage;
}

const confidenceMap = {
  high: 3,
  medium: 2,
  low: 1
};

const severityStyles = {
  mild: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  severe: "bg-red-100 text-red-800"
};

const urgencyStyles = {
  immediate: "bg-red-100 text-red-800",
  within_week: "bg-orange-100 text-orange-800",
  monitor: "bg-green-100 text-green-800"
};

export default function DiagnosisResult({ data, language }: DiagnosisResultProps) {
  if (data.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {data.error}
      </div>
    );
  }

  const isHindi = language === "hindi";

  return (
    <div className="space-y-4 rounded-xl border border-green-200 bg-white p-6 shadow-sm">
      {data.not_sure && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          AI को पूरा यकीन नहीं है — कृपया नज़दीकी कृषि केंद्र से सलाह लें
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyles[data.severity]}`}>
          Severity: {data.severity}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyStyles[data.urgency]}`}>
          Urgency: {data.urgency}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {isHindi ? "पौधा / फसल का नाम" : "Plant / Crop Name"}
        </p>
        <h2 className="text-xl font-bold text-green-900">{isHindi ? data.crop_name_hindi : data.crop_name}</h2>
        <p className="text-sm text-gray-600">{isHindi ? data.crop_name : data.crop_name_hindi}</p>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {isHindi ? "रोग का नाम" : "Disease Name"}
        </p>
        <h3 className="text-2xl font-bold text-green-900">{isHindi ? data.disease_name_hindi : data.disease_name}</h3>
        <p className="text-sm text-gray-600">{isHindi ? data.disease_name : data.disease_name_hindi}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
          <span>Confidence:</span>
          <span>
            {[1, 2, 3, 4].map((dot) => (
              <span key={dot} className={dot <= confidenceMap[data.confidence] ? "text-green-700" : "text-gray-300"}>
                ●
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="grid gap-2 border-y border-gray-200 py-4 text-sm">
        <p>
          <span className="font-semibold">Cause: </span>
          {isHindi ? data.cause_hindi : data.cause}
        </p>
        <p>
          <span className="font-semibold">Affected: </span>
          {data.affected_part}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-green-900">Treatment Steps</h3>
        {data.steps.length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-600">
            {isHindi ? "कोई उपचार चरण उपलब्ध नहीं है।" : "No treatment steps available."}
          </div>
        ) : (
          data.steps.map((step) => (
            <div key={step.step} className="rounded-lg border border-gray-200 p-3 text-sm">
              <p className="font-medium">
                {step.step}. {isHindi ? step.action_hindi : step.action}
              </p>
              {(step.product || step.dosage) && (
                <p className="mt-1 text-gray-600">
                  {step.product ?? "General"}
                  {step.dosage ? ` — ${step.dosage}` : ""}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border-l-4 border-green-600 bg-green-50 p-3 text-sm text-green-900">
        {isHindi ? data.prevention_hindi : data.prevention}
      </div>
    </div>
  );
}
