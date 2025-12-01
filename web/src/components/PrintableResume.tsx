import React from "react";
import type { Resume } from "../types/resume";

type Props = { data: Resume };

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-4 mb-1 text-lg font-semibold tracking-wide uppercase">{children}</h2>
);

export default function PrintableResume({ data }: Props) {
  return (
    <div className="mx-auto max-w-[8.5in] bg-white text-black p-6">
      {/* Header */}
      <header className="text-center border-b pb-2">
        <h1 className="text-3xl font-bold">{data.name}</h1>
        {data.title && <div className="text-sm mt-1">{data.title}</div>}
        <div className="text-xs mt-2 flex flex-wrap gap-2 justify-center">
          {data.contact.email && <span>{data.contact.email}</span>}
          {data.contact.phone && <span>• {data.contact.phone}</span>}
          {data.contact.location && <span>• {data.contact.location}</span>}
          {data.contact.links?.map((l, i) => (
            <span key={i}>• {l.label}</span>
          ))}
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section>
          <SectionTitle>Summary</SectionTitle>
          <p className="text-sm leading-5">{data.summary}</p>
        </section>
      )}

      {/* Sections */}
      {data.sections.map((sec, idx) => {
        if (sec.kind === "Skills") {
          return (
            <section key={idx}>
              <SectionTitle>Skills</SectionTitle>
              <ul className="text-sm leading-5 list-disc pl-5">
                {sec.groups.map((g, i) => (
                  <li key={i}><strong>{g.label}:</strong> {g.items.join(", ")}</li>
                ))}
              </ul>
            </section>
          );
        }
        if (sec.kind === "Experience") {
          return (
            <section key={idx}>
              <SectionTitle>Experience</SectionTitle>
              {sec.items.map((e, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between text-sm">
                    <strong>{e.role} • {e.company}</strong>
                    <span className="text-xs">{e.start} – {e.end}{e.location ? ` • ${e.location}` : ""}</span>
                  </div>
                  <ul className="list-disc pl-5 text-sm leading-5">
                    {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </section>
          );
        }
        if (sec.kind === "Projects") {
          return (
            <section key={idx}>
              <SectionTitle>Projects</SectionTitle>
              {sec.items.map((p, i) => (
                <div key={i} className="mb-2">
                  <div className="text-sm"><strong>{p.name}</strong>{p.tech?.length ? ` — ${p.tech.join(", ")}` : ""}</div>
                  <ul className="list-disc pl-5 text-sm leading-5">
                    {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </section>
          );
        }
        if (sec.kind === "Education") {
          return (
            <section key={idx}>
              <SectionTitle>Education</SectionTitle>
              {sec.items.map((ed, i) => (
                <div key={i} className="mb-2">
                  <div className="flex justify-between text-sm">
                    <strong>{ed.degree} • {ed.school}</strong>
                    <span className="text-xs">{ed.start} – {ed.end}</span>
                  </div>
                  {ed.details?.length ? (
                    <ul className="list-disc pl-5 text-sm leading-5">
                      {ed.details.map((d, j) => <li key={j}>{d}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </section>
          );
        }
        // Achievements
        return (
          <section key={idx}>
            <SectionTitle>Achievements</SectionTitle>
            <ul className="list-disc pl-5 text-sm leading-5">
              {sec.items.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
