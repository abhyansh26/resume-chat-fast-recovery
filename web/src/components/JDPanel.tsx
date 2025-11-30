import { useMemo, useState } from "react";

const STOP = new Set([
  "and","or","the","a","an","with","for","to","of","in","on","by","at","is","are","as",
  "you","your","we","our","be","this","that","from","will","into","per","via","etc"
]);

function tokenize(s: string) {
  return (s.toLowerCase().match(/[a-z0-9\-\+#\.]{3,}/g) || [])
    .filter(w => !STOP.has(w));
}

export default function JDPanel({ resume }: { resume: string }) {
  const [jd, setJd] = useState("");

  const { present, missing } = useMemo(() => {
    const rset = new Set(tokenize(resume));
    const j = tokenize(jd);
    const pres: string[] = [];
    const miss: string[] = [];
    for (const w of new Set(j)) {
      (rset.has(w) ? pres : miss).push(w);
    }
    pres.sort(); miss.sort();
    return { present: pres.slice(0, 60), missing: miss.slice(0, 60) };
  }, [jd, resume]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <header className="px-4 py-3 border-b border-slate-800">
        <h3 className="font-medium">Tailor to Job Description (ATS-ish)</h3>
      </header>
      <div className="p-4 grid gap-3">
        <textarea
          className="w-full min-h-[120px] rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2"
          placeholder="Paste the job description here…"
          value={jd}
          onChange={(e)=>setJd(e.target.value)}
        />
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <h4 className="text-sm text-emerald-300 mb-1">Covered keywords ({present.length})</h4>
            <div className="flex flex-wrap gap-1">
              {present.map(k => <span key={k} className="text-xs rounded bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5">{k}</span>)}
            </div>
          </div>
          <div>
            <h4 className="text-sm text-rose-300 mb-1">Missing keywords ({missing.length})</h4>
            <div className="flex flex-wrap gap-1">
              {missing.map(k => <span key={k} className="text-xs rounded bg-rose-500/10 border border-rose-400/20 px-2 py-0.5">{k}</span>)}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">Tip: Add missing keywords only if they’re truthful and relevant.</p>
      </div>
    </section>
  );
}
