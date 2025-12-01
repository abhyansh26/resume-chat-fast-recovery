// web/src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Builder from "./pages/Builder";
import DebugPreview from "./pages/DebugPreview";

export default function App() {
  return (
    <BrowserRouter>
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-end gap-4">
          <Link to="/" className="text-sm text-slate-300 hover:text-white">Builder</Link>
          <Link to="/debug" className="text-sm text-slate-300 hover:text-white">Debug</Link>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Builder />} />
        <Route path="/debug" element={<DebugPreview />} />
      </Routes>
    </BrowserRouter>
  );
}
