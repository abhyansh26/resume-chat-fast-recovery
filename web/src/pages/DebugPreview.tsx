// web/src/pages/DebugPreview.tsx
import { useEffect, useMemo, useState } from "react";
import { renderATSClassic, sampleATSData, type ATSForm } from "../templates/atsClassic";

export default function DebugPreview() {
  const [form, setForm] = useState<ATSForm>(sampleATSData);

  useEffect(() => { document.title = "Debug Print Preview"; }, []);

  const html = useMemo(() => renderATSClassic(form), [form]);

  const setK = <K extends keyof ATSForm>(k: K, v: ATSForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setSection = (k: keyof ATSForm["sections"], v: boolean) =>
    setForm((f) => ({ ...f, sections: { ...f.sections, [k]: v }}));

  const addExp = () => setForm(f => ({
    ...f,
    experience: [...f.experience, {
      company: "", role: "", start: "", end: "Present", bullets: []
    }]
  }));

  const addProj = () => setForm(f => ({
    ...f,
    projects: [...f.projects, { name: "", link: "", stack: [], bullets: [] }]
  }));

  const addEdu = () => setForm(f => ({
    ...f,
    education: [...f.education, { school: "", degree: "", details: [] }]
  }));

  return (
    <div style={{padding: 16}}>
      {/* top actions */}
      <div className="no-print" style={{display:"flex", flexWrap:"wrap", gap:12, alignItems:"center", marginBottom: 12}}>
        <button onClick={() => window.print()} style={{padding:"8px 12px", border:"1px solid #ddd", borderRadius:8}}>Print / Save as PDF</button>
        <button onClick={() => setForm(sampleATSData)} style={{padding:"8px 12px", border:"1px solid #ddd", borderRadius:8}}>Reset to Sample</button>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(form,null,2))} style={{padding:"8px 12px", border:"1px solid #ddd", borderRadius:8}}>Copy JSON</button>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "minmax(360px, 1fr) 210mm", gap: 16}}>
        {/* LEFT PANEL (daily-use friendly) */}
        <div className="no-print" style={{display:"grid", gap:14}}>
          <div style={{display:"grid", gap:8}}>
            <strong>Header</strong>
            <input placeholder="Full Name" value={form.name} onChange={e=>setK("name", e.target.value)} />
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <input placeholder="City" value={form.city} onChange={e=>setK("city", e.target.value)} />
              <input placeholder="State" value={form.state} onChange={e=>setK("state", e.target.value)} />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <input placeholder="Email" value={form.email} onChange={e=>setK("email", e.target.value)} />
              <input placeholder="Phone" value={form.phone} onChange={e=>setK("phone", e.target.value)} />
            </div>
            <input placeholder="LinkedIn (optional)" value={form.linkedin||""} onChange={e=>setK("linkedin", e.target.value)} />
            <input placeholder="GitHub (optional)" value={form.github||""} onChange={e=>setK("github", e.target.value)} />
          </div>

          <div style={{display:"grid", gap:6}}>
            <strong>Sections (toggle on/off)</strong>
            {Object.entries(form.sections).map(([k, val]) => (
              <label key={k} style={{display:"flex", alignItems:"center", gap:8}}>
                <input type="checkbox" checked={val} onChange={e=>setSection(k as any, e.target.checked)} />
                {k.toUpperCase()}
              </label>
            ))}
          </div>

          {form.sections.summary && (
            <div style={{display:"grid", gap:6}}>
              <strong>Summary</strong>
              <textarea value={form.summary} onChange={e=>setK("summary", e.target.value)} />
            </div>
          )}

          {form.sections.experience && (
            <div style={{display:"grid", gap:8}}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <strong>Experience</strong>
                <button onClick={addExp}>+ Add Role</button>
              </div>
              {form.experience.map((ex, i) => (
                <div key={i} style={{border:"1px solid #eee", borderRadius:8, padding:8, display:"grid", gap:6}}>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                    <input placeholder="Company" value={ex.company} onChange={e=>{
                      const v = e.target.value; setForm(f=>{ const arr=[...f.experience]; arr[i]={...arr[i], company:v}; return {...f, experience:arr};});
                    }} />
                    <input placeholder="Role" value={ex.role} onChange={e=>{
                      const v = e.target.value; setForm(f=>{ const arr=[...f.experience]; arr[i]={...arr[i], role:v}; return {...f, experience:arr};});
                    }} />
                  </div>
                  <input placeholder="Location (optional)" value={ex.location||""} onChange={e=>{
                    const v=e.target.value; setForm(f=>{ const arr=[...f.experience]; arr[i]={...arr[i], location:v}; return {...f, experience:arr};});
                  }} />
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                    <input placeholder="Start (e.g., Sep 2022)" value={ex.start} onChange={e=>{
                      const v=e.target.value; setForm(f=>{ const arr=[...f.experience]; arr[i]={...arr[i], start:v}; return {...f, experience:arr};});
                    }} />
                    <input placeholder="End (e.g., Present)" value={ex.end} onChange={e=>{
                      const v=e.target.value; setForm(f=>{ const arr=[...f.experience]; arr[i]={...arr[i], end:v}; return {...f, experience:arr};});
                    }} />
                  </div>
                  <textarea
                    placeholder="Bullets (one per line)"
                    value={ex.bullets.join("\n")}
                    onChange={e=>{
                      const v = e.target.value.split("\n").filter(Boolean);
                      setForm(f=>{ const arr=[...f.experience]; arr[i]={...arr[i], bullets:v}; return {...f, experience:arr};});
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {form.sections.projects && (
            <div style={{display:"grid", gap:8}}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <strong>Projects</strong>
                <button onClick={addProj}>+ Add Project</button>
              </div>
              {form.projects.map((p, i) => (
                <div key={i} style={{border:"1px solid #eee", borderRadius:8, padding:8, display:"grid", gap:6}}>
                  <input placeholder="Project name" value={p.name} onChange={e=>{
                    const v=e.target.value; setForm(f=>{ const arr=[...f.projects]; arr[i]={...arr[i], name:v}; return {...f, projects:arr};});
                  }} />
                  <input placeholder="Link (optional)" value={p.link||""} onChange={e=>{
                    const v=e.target.value; setForm(f=>{ const arr=[...f.projects]; arr[i]={...arr[i], link:v}; return {...f, projects:arr};});
                  }} />
                  <input placeholder="Stack (comma-separated)" value={(p.stack||[]).join(", ")} onChange={e=>{
                    const v=e.target.value.split(",").map(s=>s.trim()).filter(Boolean);
                    setForm(f=>{ const arr=[...f.projects]; arr[i]={...arr[i], stack:v}; return {...f, projects:arr};});
                  }} />
                  <textarea
                    placeholder="Bullets (one per line)"
                    value={(p.bullets||[]).join("\n")}
                    onChange={e=>{
                      const v=e.target.value.split("\n").filter(Boolean);
                      setForm(f=>{ const arr=[...f.projects]; arr[i]={...arr[i], bullets:v}; return {...f, projects:arr};});
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {form.sections.education && (
            <div style={{display:"grid", gap:8}}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <strong>Education</strong>
                <button onClick={addEdu}>+ Add School</button>
              </div>
              {form.education.map((ed, i)=>(
                <div key={i} style={{border:"1px solid #eee", borderRadius:8, padding:8, display:"grid", gap:6}}>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                    <input placeholder="School" value={ed.school} onChange={e=>{
                      const v=e.target.value; setForm(f=>{ const arr=[...f.education]; arr[i]={...arr[i], school:v}; return {...f, education:arr};});
                    }} />
                    <input placeholder="Degree" value={ed.degree} onChange={e=>{
                      const v=e.target.value; setForm(f=>{ const arr=[...f.education]; arr[i]={...arr[i], degree:v}; return {...f, education:arr};});
                    }} />
                  </div>
                  <input placeholder="Grad (e.g., May 2026)" value={ed.grad||""} onChange={e=>{
                    const v=e.target.value; setForm(f=>{ const arr=[...f.education]; arr[i]={...arr[i], grad:v}; return {...f, education:arr};});
                  }} />
                  <textarea
                    placeholder="Details (one per line)"
                    value={(ed.details||[]).join("\n")}
                    onChange={e=>{
                      const v=e.target.value.split("\n").filter(Boolean);
                      setForm(f=>{ const arr=[...f.education]; arr[i]={...arr[i], details:v}; return {...f, education:arr};});
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {form.sections.skills && (
            <div style={{display:"grid", gap:6}}>
              <strong>Skills</strong>
              <textarea
                placeholder="Comma-separated"
                value={form.skills.join(", ")}
                onChange={e=>setK("skills", e.target.value.split(",").map(s=>s.trim()).filter(Boolean))}
              />
            </div>
          )}

          {form.sections.certifications && (
            <div style={{display:"grid", gap:6}}>
              <strong>Certifications</strong>
              <textarea
                placeholder="One certification per line"
                value={form.certifications.join("\n")}
                onChange={e=>setK("certifications", e.target.value.split("\n").filter(Boolean))}
              />
            </div>
          )}
        </div>

        {/* RIGHT: A4 preview */}
        <div className="a4" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
