// web/src/components/JDPanel.tsx
import React, { useMemo, useState } from "react";

type JDPanelProps = {
  // The current resume text from Builder
  resume: string;
};

type JDKeyword = {
  term: string;
  countInJD: number;
  weight: number;
  inResume: boolean;
};

// Very basic English stopwords to ignore when extracting keywords.
// This doesn't need to be perfect – just enough to skip noise words.
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "you",
  "their",
  "they",
  "but",
  "are",
  "our",
  "will",
  "who",
  "what",
  "why",
  "how",
  "when",
  "where",
  "into",
  "over",
  "under",
  "about",
  "more",
  "most",
  "least",
  "very",
  "such",
  "as",
  "an",
  "a",
  "of",
  "on",
  "in",
  "to",
  "by",
  "at",
  "is",
  "be",
  "we",
  "or",
  "it",
  "its",
  "can",
  "may",
  "etc",
]);

// Some tech / skills hint words that we treat as slightly higher impact.
const TECH_HINTS = new Set([
  "python",
  "java",
  "javascript",
  "typescript",
  "react",
  "node",
  "aws",
  "azure",
  "gcp",
  "lambda",
  "dynamodb",
  "s3",
  "kubernetes",
  "docker",
  "sql",
  "nosql",
  "postgres",
  "mongodb",
  "spark",
  "hadoop",
  "airflow",
  "etl",
  "ml",
  "machine",
  "learning",
  "pandas",
  "numpy",
  "fastapi",
  "spring",
  "rest",
  "microservices",
  "cloud",
  "ci",
  "cd",
  "github",
  "gitlab",
  "terraform",
]);

function normalizeWord(raw: string): string {
  // Lowercase, keep letters/numbers and a few special chars used in tech terms.
  return raw.toLowerCase().replace(/[^a-z0-9+#.]/g, "");
}

type JDAnalysis = {
  keywords: JDKeyword[];
  matched: JDKeyword[];
  missing: JDKeyword[];
  score: number; // 0–100
};

// Extract keywords from the JD and compare them to the resume.
function analyzeJD(jdText: string, resumeText: string): JDAnalysis {
  const jdNorm = jdText.toLowerCase();
  const resumeNorm = resumeText.toLowerCase();

  // Step 1: split JD into words and build frequency map
  const freq = new Map<string, number>();
  for (const raw of jdNorm.split(/\s+/)) {
    const w = normalizeWord(raw);
    if (!w) continue;
    if (w.length < 3) continue; // ignore really short words
    if (STOPWORDS.has(w)) continue;
    const prev = freq.get(w) ?? 0;
    freq.set(w, prev + 1);
  }

  // Turn into array and sort by frequency descending
  let entries = Array.from(freq.entries()).map(([term, count]) => ({
    term,
    count,
  }));
  entries.sort((a, b) => b.count - a.count);

  // Limit to top N keywords to keep UI manageable
  const MAX_TERMS = 40;
  entries = entries.slice(0, MAX_TERMS);

  const keywords: JDKeyword[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  for (const { term, count } of entries) {
    // Base weight: 1
    let weight = 1;

    // If it's mentioned many times in the JD, bump weight a bit
    if (count >= 3) weight += 0.5;

    // If it's a known tech / skills word, bump weight more
    if (TECH_HINTS.has(term)) weight += 0.5;

    // Check if this term appears anywhere in the resume (case-insensitive)
    const inResume = resumeNorm.includes(term);

    if (inResume) {
      matchedWeight += weight;
    }
    totalWeight += weight;

    keywords.push({
      term,
      countInJD: count,
      weight,
      inResume,
    });
  }

  let score = 0;
  if (totalWeight > 0) {
    score = Math.round((matchedWeight / totalWeight) * 100);
    if (score > 100) score = 100;
    if (score < 0) score = 0;
  }

  const matched = keywords.filter((k) => k.inResume);
  const missing = keywords.filter((k) => !k.inResume);

  return { keywords, matched, missing, score };
}

// Build a JSX representation of the resume text where matching
// JD keywords are highlighted in green.
function buildHighlightedResume(resume: string, analysis: JDAnalysis): React.ReactNode {
  if (!resume) {
    return <span className="text-slate-500">Paste or write your resume above to see highlighting.</span>;
  }
  if (analysis.keywords.length === 0) {
    return <span className="text-slate-500">Paste a job description on the left to highlight relevant terms.</span>;
  }

  // Build a set of terms that are in both JD and resume.
  const matchedSet = new Set(
    analysis.keywords.filter((k) => k.inResume).map((k) => k.term.toLowerCase())
  );

  // Split resume into tokens, while keeping whitespace tokens so spacing is preserved.
  const tokens = resume.split(/(\s+)/);

  return (
    <>
      {tokens.map((tok, idx) => {
        // If this is pure whitespace, just render it.
        if (/^\s+$/.test(tok)) {
          return <span key={idx}>{tok}</span>;
        }

        const norm = normalizeWord(tok);
        if (norm && matchedSet.has(norm)) {
          return (
            <span
              key={idx}
              className="bg-emerald-900/60 text-emerald-100 rounded-sm px-0.5"
            >
              {tok}
            </span>
          );
        }
        return <span key={idx}>{tok}</span>;
      })}
    </>
  );
}

const JDPanel: React.FC<JDPanelProps> = ({ resume }) => {
  const [jdText, setJDText] = useState("");

  const analysis = useMemo(() => analyzeJD(jdText, resume), [jdText, resume]);
  const { keywords, matched, missing, score } = analysis;

  const totalKeywords = keywords.length;
  const matchPctLabel = Number.isFinite(score) ? `${score}%` : "0%";

  // Top missing terms (sorted by weight, then by frequency)
  const topMissing = useMemo(() => {
    const sorted = [...missing].sort((a, b) => {
      if (b.weight === a.weight) {
        return b.countInJD - a.countInJD;
      }
      return b.weight - a.weight;
    });
    return sorted.slice(0, 10);
  }, [missing]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Job Description Tailor (ATS helper)
          </h3>
          <p className="text-xs text-slate-400">
            Paste a JD, see key terms, and check how well your resume covers them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Match score
            </span>
            <span
              className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                score >= 75
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  : score >= 40
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
              }`}
            >
              {matchPctLabel}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: JD input + keyword chips */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Job description
            </label>
            <textarea
              className="w-full min-h-[140px] text-xs rounded-xl bg-slate-900/80 border border-slate-700 px-3 py-2 text-slate-100 outline-none resize-y"
              placeholder="Paste the job description here. We'll extract important keywords and compare them against your resume."
              value={jdText}
              onChange={(e) => setJDText(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-slate-500">
              We use a simple heuristic approach (no external API) to find role-specific keywords.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">
                Extracted keywords
              </span>
              <span className="text-[10px] text-slate-500">
                {totalKeywords === 0
                  ? "Paste a JD above"
                  : `${matched.length} covered • ${missing.length} missing`}
              </span>
            </div>

            {totalKeywords === 0 ? (
              <p className="text-xs text-slate-500">
                Once you paste a job description, we’ll show the most important words and whether
                they appear in your resume.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {keywords.map((k) => (
                  <span
                    key={k.term}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border ${
                      k.inResume
                        ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/40"
                        : "bg-slate-800 text-slate-200 border-slate-600"
                    }`}
                    title={`Mentioned ${k.countInJD}x in JD • weight ${k.weight.toFixed(1)}`}
                  >
                    {k.term}
                    {k.inResume ? (
                      <span className="text-[9px] opacity-70">✓</span>
                    ) : (
                      <span className="text-[9px] opacity-50">＋</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {topMissing.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-medium">
                High-impact terms you might add
              </span>
              <p className="text-[10px] text-slate-500">
                These appear often in the JD but not in your resume yet. Consider weaving them into
                your bullets when they are genuinely true for you.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {topMissing.map((k) => (
                  <span
                    key={k.term}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-rose-500/10 text-rose-200 border border-rose-500/40"
                  >
                    {k.term}
                    <span className="text-[9px] opacity-70">{k.countInJD}×</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Resume coverage preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">
              Resume coverage preview
            </span>
            <span className="text-[10px] text-slate-500">
              Green = term from the JD that appears in your resume
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 max-h-64 overflow-y-auto font-mono leading-relaxed">
            {buildHighlightedResume(resume, analysis)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JDPanel;
