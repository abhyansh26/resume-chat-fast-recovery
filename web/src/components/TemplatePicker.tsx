// web/src/components/TemplatePicker.tsx
import React from "react";
import {
  type ResumeModel,
  SWE_TEMPLATE_MODEL,
  DATA_TEMPLATE_MODEL,
  INTERN_TEMPLATE_MODEL,
  renderResumePlainText,
} from "../types/resumeModel";

type TemplateId = "swe" | "data" | "intern";

interface TemplateDef {
  id: TemplateId;
  label: string;
  description: string;
  model: ResumeModel;
}

const templates: TemplateDef[] = [
  {
    id: "swe",
    label: "Tech SWE",
    description: "Backend / full-stack engineering focus",
    model: SWE_TEMPLATE_MODEL,
  },
  {
    id: "data",
    label: "Data / Analytics",
    description: "Analytics, BI, data pipelines, ML-lite",
    model: DATA_TEMPLATE_MODEL,
  },
  {
    id: "intern",
    label: "Intern / Early-career",
    description: "Student or first-role template",
    model: INTERN_TEMPLATE_MODEL,
  },
];

export interface TemplatePickerProps {
  // Now returns both the plain text and the structured model
  onApplyTemplate: (text: string, model: ResumeModel) => void;
}

export default function TemplatePicker({ onApplyTemplate }: TemplatePickerProps) {
  return (
    <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/70 text-xs flex flex-wrap gap-2 items-center">
      <span className="text-slate-400 mr-1">Start from template:</span>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            const text = renderResumePlainText(t.model);
            onApplyTemplate(text, t.model);
          }}
          className="rounded-lg border border-slate-700/80 px-3 py-1 hover:bg-slate-800 text-slate-100"
          title={t.description}
        >
          {t.label}
        </button>
      ))}
      <span className="text-[10px] text-slate-500 ml-auto">
        You can edit everything after applying.
      </span>
    </div>
  );
}
