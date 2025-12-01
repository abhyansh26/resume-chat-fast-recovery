// web/src/templates/atsClassic.ts
export type ATSForm = {
  name: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;

  sections: {
    summary: boolean;
    experience: boolean;
    projects: boolean;
    education: boolean;
    skills: boolean;
    certifications: boolean;
  };

  summary: string;

  experience: Array<{
    company: string;
    role: string;
    location?: string;
    start: string;  // "Jan 2024"
    end: string;    // "Present" or "Oct 2025"
    bullets: string[];
  }>;

  projects: Array<{
    name: string;
    link?: string;
    stack?: string[];      // e.g., ["Next.js","FastAPI","AWS"]
    bullets: string[];     // one-liners, impact-focused
  }>;

  education: Array<{
    school: string;
    degree: string;
    grad?: string;         // "May 2026"
    details?: string[];
  }>;

  skills: string[];        // list; rendered comma-separated
  certifications: string[]; // list of cert names
};

const esc = (s: string) =>
  (s || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");

const link = (url?: string) =>
  url ? `<a href="${esc(url)}">${esc(url)}</a>` : "";

export function renderATSClassic(d: ATSForm): string {
  const contactParts = [
    [esc(`${d.city}${d.state ? ", " + d.state : ""}`)],
    [esc(d.email)],
    [esc(d.phone)],
    d.linkedin ? [link(d.linkedin)] : [],
    d.github ? [link(d.github)] : [],
  ].filter(Boolean);

  const contactHTML = contactParts
    .map((part, i) => (i ? `<span class="sep">•</span>` : "") + `<span>${part.join(" ")}</span>`)
    .join(" ");

  const expHTML = (d.experience || []).map(e => `
    <div class="job">
      <div class="job-head">
        <div>${esc(e.role)} — ${esc(e.company)}</div>
        <div>${esc(e.start)} – ${esc(e.end)}</div>
      </div>
      ${e.location ? `<div class="job-meta">${esc(e.location)}</div>` : ""}
      <ul class="ats">
        ${(e.bullets || []).map(b => `<li>${esc(b)}</li>`).join("")}
      </ul>
    </div>`).join("");

  const projHTML = (d.projects || []).map(p => `
    <div class="job">
      <div class="job-head">
        <div>${esc(p.name)}${p.link ? ` — ${link(p.link)}` : ""}</div>
        <div>${(p.stack || []).map(esc).join(" · ")}</div>
      </div>
      <ul class="ats">
        ${(p.bullets || []).map(b => `<li>${esc(b)}</li>`).join("")}
      </ul>
    </div>`).join("");

  const eduHTML = (d.education || []).map(ed => `
    <div class="job">
      <div class="job-head">
        <div>${esc(ed.degree)} — ${esc(ed.school)}</div>
        <div>${ed.grad ? esc(ed.grad) : ""}</div>
      </div>
      ${(ed.details && ed.details.length) ? `
        <ul class="ats">${ed.details.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    </div>`).join("");

  const skillsHTML = esc((d.skills || []).join(", "));
  const certsHTML = (d.certifications || []).length
    ? `<ul class="ats">${d.certifications.map(c => `<li>${esc(c)}</li>`).join("")}</ul>`
    : "";

  return `
    <div class="ats-header">
      <h1 class="ats-name">${esc(d.name)}</h1>
      <div class="ats-contact">${contactHTML}</div>
    </div>

    ${d.sections.summary ? `
      <div class="section">
        <div class="section-title">SUMMARY</div>
        <div style="font-size:10.5pt;">${esc(d.summary)}</div>
      </div>` : ""}

    ${d.sections.experience ? `
      <div class="section">
        <div class="section-title">EXPERIENCE</div>
        ${expHTML || `<div style="font-size:10.5pt;color:#6b7280">Add roles to populate this section.</div>`}
      </div>` : ""}

    ${d.sections.projects ? `
      <div class="section">
        <div class="section-title">PROJECTS</div>
        ${projHTML || `<div style="font-size:10.5pt;color:#6b7280">Add projects to populate this section.</div>`}
      </div>` : ""}

    ${d.sections.education ? `
      <div class="section">
        <div class="section-title">EDUCATION</div>
        ${eduHTML || `<div style="font-size:10.5pt;color:#6b7280">Add education to populate this section.</div>`}
      </div>` : ""}

    ${d.sections.skills ? `
      <div class="section">
        <div class="section-title">SKILLS</div>
        <div style="font-size:10.5pt;">${skillsHTML || "—"}</div>
      </div>` : ""}

    ${d.sections.certifications ? `
      <div class="section">
        <div class="section-title">CERTIFICATIONS</div>
        ${certsHTML || `<div style="font-size:10.5pt;color:#6b7280">Add certifications to populate this section.</div>`}
      </div>` : ""}
  `;
}

export const sampleATSData: ATSForm = {
  name: "JASWANT VEMULAPALLI",
  city: "College Park",
  state: "MD",
  email: "vjaswant7@gmail.com",
  phone: "(XXX) XXX-XXXX",
  linkedin: "linkedin.com/in/jaswant-vemulapalli",
  github: "github.com/jaswantvemulapalli",

  sections: {
    summary: true,
    experience: true,
    projects: true,
    education: true,
    skills: true,
    certifications: false,
  },

  summary:
    "Grad student in Software Engineering. Build cloud-native, data-heavy systems (AWS + FastAPI + React). Comfortable with Python/Java, SQL, and ML-assisted workflows.",

  experience: [
    {
      company: "7-Eleven Global Solution Centre",
      role: "Software Engineer",
      location: "Bangalore, India",
      start: "Sep 2022",
      end: "Jun 2024",
      bullets: [
        "Built REST APIs (AWS Lambda + MongoDB) used across 10K+ stores.",
        "Cut AWS charges by 3% via targeted optimizations and Prod fixes.",
        "Delivered global audit service at 2.64s runtime."
      ]
    },
    {
      company: "Infineon Technologies",
      role: "Application Engineer Intern",
      location: "Bangalore, India",
      start: "Jan 2022",
      end: "Jun 2022",
      bullets: [
        "Optimized FreeRTOS app + custom bootloader; 40% faster upgrades.",
        "Secure bootloader design cut software update time by 30%."
      ]
    }
  ],

  projects: [
    {
      name: "Resume Chat with Fast Session Recovery",
      link: "https://dvxexndtccpr9.cloudfront.net/",
      stack: ["React", "FastAPI", "AWS Lambda", "DynamoDB", "S3"],
      bullets: [
        "Hot (DynamoDB) + cold (S3) storage with one-click snapshot/restore.",
        "LLM-assisted bullet rewriting via Groq API with role-based prompts."
      ]
    }
  ],

  education: [
    {
      school: "University of Maryland, College Park",
      degree: "Master of Engineering, Software Engineering",
      grad: "Expected May 2026",
      details: ["GPA ~3.9–4.0", "Cloud Computing, Software Architecture, Data Science"]
    }
  ],

  skills: [
    "Python","Java","JavaScript","SQL",
    "React","FastAPI","AWS (Lambda, S3, DynamoDB)","Docker","Git","CI/CD"
  ],

  certifications: []
};
