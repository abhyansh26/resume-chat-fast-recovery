// web/src/components/SelectionAssistant.tsx
import React from "react";

interface SelectionAssistantProps {
  isOpen: boolean;
  selectedText: string;
  onClose: () => void;

  onSendToChat: () => void;
  onRephrase: () => void;
  onShorten: () => void;
  onQuantify: () => void;
  onStar: () => void;
  onMetrics: () => void;
}

export const SelectionAssistant: React.FC<SelectionAssistantProps> = ({
  isOpen,
  selectedText,
  onClose,
  onSendToChat,
  onRephrase,
  onShorten,
  onQuantify,
  onStar,
  onMetrics,
}) => {
  if (!isOpen || !selectedText.trim()) return null;

  return (
    <div className="fixed right-6 bottom-6 z-40 max-w-xs rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 to-slate-900 px-4 py-3 shadow-2xl shadow-slate-900/80">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Resume assistant
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-slate-400 hover:text-slate-200"
        >
          Close ✕
        </button>
      </div>

      <div className="mb-1 text-[11px] text-slate-300">
        Working with your selection:
      </div>

      <div
        className="mb-3 max-h-14 overflow-hidden text-ellipsis whitespace-nowrap border-l-2 border-slate-600 pl-2 text-[11px] text-slate-200"
        title={selectedText}
      >
        {selectedText}
      </div>

      {/* Send to chat */}
      <button
        type="button"
        onClick={onSendToChat}
        className="mb-2 w-full rounded-full border border-indigo-500/70 bg-indigo-500/10 px-3 py-1.5 text-[11px] text-indigo-100 hover:bg-indigo-500/20"
      >
        ↔ Send selection to chat
      </button>

      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRephrase}
          className="flex-1 rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
        >
          Rephrase
        </button>
        <button
          type="button"
          onClick={onShorten}
          className="flex-1 rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-100 hover:bg-slate-800"
        >
          Shorten
        </button>
        <button
          type="button"
          onClick={onQuantify}
          className="flex-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
        >
          Quantify
        </button>
        <button
          type="button"
          onClick={onStar}
          className="flex-1 rounded-full border border-indigo-500/70 bg-indigo-500/10 px-3 py-1.5 text-[11px] text-indigo-100 hover:bg-indigo-500/20"
        >
          Make STAR
        </button>
        <button
          type="button"
          onClick={onMetrics}
          className="w-full rounded-full border border-amber-500/70 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-100 hover:bg-amber-500/20"
        >
          Metrics helper
        </button>
      </div>

      <div className="text-[10px] text-slate-500">
        The model sees your full resume + this selected text when these actions run.
      </div>
    </div>
  );
};
