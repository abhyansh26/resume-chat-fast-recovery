// web/src/App.tsx
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Builder from "./pages/Builder";
import DebugPreview from "./pages/DebugPreview";

// ✅ Support both flags:
// - VITE_SHOW_DEBUG=true
// - VITE_FEATURE_TEMPLATES=1
const showDebug =
  import.meta.env.VITE_SHOW_DEBUG === "true" ||
  import.meta.env.VITE_FEATURE_TEMPLATES === "1";

export default function App() {
  return (
    <BrowserRouter>
      {/* 🔹 Single global sticky header for the whole app */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Left: App title and description */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 grid place-items-center">
              🗂️
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100">
                Resume Chat — Fast Session Recovery
              </h1>
              <p className="text-xs text-slate-400">
                Edit your resume, chat with the assistant, autosave, and snapshot sessions.
              </p>
            </div>
          </div>

          {/* Right: Small nav */}
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/builder" className="text-slate-300 hover:text-white">
              Builder
            </Link>
            {showDebug && (
              <Link to="/debug" className="text-slate-300 hover:text-white">
                Debug
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* 🔹 Routes */}
      <Routes>
        {/* Default: redirect "/" → "/builder" */}
        <Route path="/" element={<Navigate to="/builder" replace />} />

        {/* Main resume builder */}
        <Route path="/builder" element={<Builder />} />

        {/* Debug/preview page (optional) */}
        {showDebug && <Route path="/debug" element={<DebugPreview />} />}

        {/* Any unknown path → Builder */}
        <Route path="*" element={<Navigate to="/builder" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
