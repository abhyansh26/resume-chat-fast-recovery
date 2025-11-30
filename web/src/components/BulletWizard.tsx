import { useState } from "react";

export default function BulletWizard({
  onInsert,
  onClose,
}: {
  onInsert: (bullet: string) => void;
  onClose: () => void;
}) {
  const [verb, setVerb] = useState("Led");
  const [what, setWhat] = useState("");
  const [how, setHow] = useState("");
  const [impact, setImpact] = useState("");
  const [metric] = useState("");


  function gen() {
    // build the bullet in a simple, human way
    const bits = [
      verb.trim(),
      what.trim(),
      how ? `using ${how.trim()}` : "",
      impact || metric ? `to ${impact || metric}` : "",
    ].filter(Boolean);
    let bullet = bits.join(" ");
    bullet = `• ${bullet}`.replace(/\s+/g, " ").trim();
    onInsert(bullet);
    onClose();
  }

  const verbs = [
    "Led","Built","Designed","Developed","Optimized","Automated","Migrated",
    "Implemented","Architected","Refactored","Deployed","Scaled","Reduced","Improved"
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Bullet Wizard</h3>
          <button className="text-slate-300 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">Action verb</span>
            <select
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={verb}
              onChange={(e)=>setVerb(e.target.value)}
            >
              {verbs.map(v => <option key={v}>{v}</option>)}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">What did you do?</span>
            <input className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="microservice to process orders; ETL for daily pipeline; etc."
              value={what} onChange={(e)=>setWhat(e.target.value)} />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">How (tools/tech/process)?</span>
            <input className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="Java + Spring Boot, Kafka, DynamoDB, Terraform"
              value={how} onChange={(e)=>setHow(e.target.value)} />
          </label>

          <div className="grid gap-1 text-sm">
            <span className="text-slate-300">Impact (results/metrics)</span>
            <input className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="cut latency by 35%; saved $2.3k/mo; handled 1.2M req/day"
              value={impact} onChange={(e)=>setImpact(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="rounded-lg border border-slate-700 px-3 py-2"
              onClick={onClose}>Cancel</button>
            <button className="rounded-lg bg-indigo-600 px-3 py-2 text-white"
              onClick={gen}>Insert bullet</button>
          </div>
        </div>
      </div>
    </div>
  );
}
