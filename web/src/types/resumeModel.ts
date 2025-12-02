// web/src/types/resumeModel.ts

// 🔹 Core types for a structured resume model

export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  start: string; // e.g. "Sep 2022"
  end: string;   // e.g. "Present"
  bullets: string[];
}

export interface ProjectItem {
  name: string;
  link?: string;
  stack?: string[]; // e.g. ["React", "AWS", "Lambda"]
  bullets: string[];
}

export interface EducationItem {
  school: string;
  degree: string;
  location?: string;
  grad?: string; // e.g. "May 2026"
  details: string[];
}

export interface ResumeModel {
  // Header
  name: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;

  // Content
  summary: string; // single summary paragraph (can have multiple sentences)
  skills: string[]; // plain skill keywords
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
}

// 🔹 A safe empty model (for future use)
export const EMPTY_RESUME_MODEL: ResumeModel = {
  name: "",
  city: "",
  state: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
};

// 🔹 Helper: join lines into a single plain-text block
function lines(arr: string[]): string {
  return arr.join("\n");
}

// 🔹 Render a ResumeModel into ATS-friendly plain text
export function renderResumePlainText(model: ResumeModel): string {
  const out: string[] = [];

  // Header
  const contactLineParts = [
    [model.city, model.state].filter(Boolean).join(", "),
    model.email,
    model.phone,
    model.linkedin,
    model.github,
  ].filter(Boolean);

  out.push(
    (model.name || "YOUR NAME").toUpperCase(),
    contactLineParts.join(" · "),
    ""
  );

  // Summary
  if (model.summary.trim()) {
    out.push("SUMMARY");
    // Split summary into bullets by newline or keep as one bullet
    const summaryLines = model.summary.split("\n").map((s) => s.trim()).filter(Boolean);
    if (summaryLines.length === 0) {
      out.push("- (Add a short 2–3 sentence summary here.)");
    } else {
      for (const s of summaryLines) {
        out.push(`- ${s}`);
      }
    }
    out.push("");
  }

  // Skills
  if (model.skills.length > 0) {
    out.push("SKILLS");
    out.push(`- ${model.skills.join(", ")}`);
    out.push("");
  }

  // Experience
  if (model.experience.length > 0) {
    out.push("EXPERIENCE");
    for (const ex of model.experience) {
      const header = `${ex.company} — ${ex.role}`;
      const locTimeParts = [
        ex.location || "",
        `${ex.start || ""} – ${ex.end || ""}`.trim(),
      ].filter(Boolean);
      out.push(header);
      if (locTimeParts.length > 0) {
        out.push(locTimeParts.join("  ·  "));
      }
      for (const b of ex.bullets) {
        out.push(`- ${b}`);
      }
      out.push("");
    }
  }

  // Projects
  if (model.projects.length > 0) {
    out.push("PROJECTS");
    for (const p of model.projects) {
      const header = p.name + (p.link ? ` — ${p.link}` : "");
      out.push(header);
      if (p.stack && p.stack.length > 0) {
        out.push(`Stack: ${p.stack.join(", ")}`);
      }
      for (const b of p.bullets) {
        out.push(`- ${b}`);
      }
      out.push("");
    }
  }

  // Education
  if (model.education.length > 0) {
    out.push("EDUCATION");
    for (const ed of model.education) {
      const header = `${ed.school} — ${ed.degree}`;
      const locGradParts = [
        ed.location || "",
        ed.grad || "",
      ].filter(Boolean);
      out.push(header);
      if (locGradParts.length > 0) {
        out.push(locGradParts.join("  ·  "));
      }
      for (const d of ed.details) {
        out.push(`- ${d}`);
      }
      out.push("");
    }
  }

  // Certifications
  if (model.certifications.length > 0) {
    out.push("CERTIFICATIONS");
    for (const c of model.certifications) {
      out.push(`- ${c}`);
    }
    out.push("");
  }

  return lines(out);
}

// 🔹 Template models: SWE / Data / Intern

export const SWE_TEMPLATE_MODEL: ResumeModel = {
  name: "YOUR NAME",
  city: "City",
  state: "State",
  email: "email@example.com",
  phone: "(555) 555-5555",
  linkedin: "linkedin.com/in/username",
  github: "github.com/username",
  summary:
    "Software Engineer with experience building backend services, REST APIs, and cloud-native applications.\n" +
    "Comfortable with Java, Python, JavaScript/TypeScript, SQL, and modern frameworks like Spring Boot and React.\n" +
    "Strong focus on reliability, performance, and writing clean, maintainable code.",
  skills: [
    "Java",
    "Python",
    "JavaScript/TypeScript",
    "SQL",
    "Spring Boot",
    "Node.js/Express",
    "React",
    "AWS (Lambda, API Gateway, DynamoDB, S3)",
    "CI/CD (GitHub Actions)",
    "REST APIs",
    "Microservices",
    "Docker",
    "Agile/Scrum",
  ],
  experience: [
    {
      company: "Company Name",
      role: "Software Engineer",
      location: "City, State",
      start: "Month YYYY",
      end: "Month YYYY",
      bullets: [
        "Built and maintained backend services using Java/Spring Boot and REST APIs consumed by web and mobile clients.",
        "Optimized database queries and caching, improving API response times and reducing cloud cost.",
        "Collaborated with cross-functional teams (Product, QA, DevOps) to deliver features on time.",
      ],
    },
    {
      company: "Company Name",
      role: "Software Engineer Intern",
      location: "City, State",
      start: "Month YYYY",
      end: "Month YYYY",
      bullets: [
        "Implemented new features and bug fixes in a production microservice using Java or Python.",
        "Wrote unit and integration tests, increasing code coverage and catching regressions early.",
        "Participated in code reviews and sprint ceremonies to align on technical approaches.",
      ],
    },
  ],
  projects: [
    {
      name: "Project Name — Short Tagline",
      link: "",
      stack: ["React", "AWS Lambda", "API Gateway", "DynamoDB"],
      bullets: [
        "Built a full-stack web app using React and a serverless backend (AWS Lambda, API Gateway, DynamoDB).",
        "Implemented authentication, CRUD APIs, and optimized data access for low latency.",
        "Deployed the app using CI/CD, monitored logs and metrics to ensure reliability.",
      ],
    },
  ],
  education: [
    {
      school: "University Name",
      degree: "M.Eng. in Software Engineering",
      location: "City, State",
      grad: "Expected Month YYYY",
      details: [
        "GPA: X.XX/4.00 (if strong)",
        "Relevant Coursework: Data Structures, Algorithms, Distributed Systems, Databases, Cloud Computing",
      ],
    },
  ],
  certifications: [],
};

export const DATA_TEMPLATE_MODEL: ResumeModel = {
  name: "YOUR NAME",
  city: "City",
  state: "State",
  email: "email@example.com",
  phone: "(555) 555-5555",
  linkedin: "linkedin.com/in/username",
  github: "github.com/username",
  summary:
    "Data / Analytics professional with experience in Python, SQL, and building data pipelines and dashboards.\n" +
    "Skilled at translating business questions into analytical problems and clear, actionable insights.\n" +
    "Comfortable working with large datasets, ETL/ELT workflows, and visualization tools.",
  skills: [
    "Python",
    "SQL",
    "Pandas",
    "NumPy",
    "scikit-learn",
    "Jupyter",
    "SQL databases (PostgreSQL, MySQL)",
    "Data modeling",
    "Power BI / Tableau / matplotlib / plotly",
    "AWS (S3, Lambda, Glue, Redshift)",
  ],
  experience: [
    {
      company: "Company Name",
      role: "Data Analyst / Analytics Engineer",
      location: "City, State",
      start: "Month YYYY",
      end: "Month YYYY",
      bullets: [
        "Built SQL and Python-based pipelines to clean, transform, and aggregate data for reporting.",
        "Created dashboards and reports to summarize KPIs and trends for business stakeholders.",
        "Partnered with product/operations teams to define metrics and track experiment results.",
      ],
    },
    {
      company: "Company Name",
      role: "Data / Business Analyst Intern",
      location: "City, State",
      start: "Month YYYY",
      end: "Month YYYY",
      bullets: [
        "Pulled data using SQL and prepared ad-hoc analyses to answer business questions.",
        "Automated manual reporting tasks, reducing turnaround time and errors.",
        "Documented assumptions, definitions, and logic for reproducibility.",
      ],
    },
  ],
  projects: [
    {
      name: "Analytics Project — Short Tagline",
      link: "",
      stack: ["Python", "Pandas", "SQL"],
      bullets: [
        "Analyzed a real-world dataset (e.g., customer behavior, transactions, or time-series) to answer a business question.",
        "Built a model or rule-based segmentation and evaluated performance.",
        "Presented results using charts, a written summary, and key recommendations.",
      ],
    },
  ],
  education: [
    {
      school: "University Name",
      degree: "M.S. in Data Science / Analytics",
      location: "City, State",
      grad: "Expected Month YYYY",
      details: [
        "GPA: X.XX/4.00 (if strong)",
        "Relevant Coursework: Statistics, Machine Learning, Data Mining, Database Systems, Data Visualization",
      ],
    },
  ],
  certifications: [],
};

export const INTERN_TEMPLATE_MODEL: ResumeModel = {
  name: "YOUR NAME",
  city: "City",
  state: "State",
  email: "email@example.com",
  phone: "(555) 555-5555",
  linkedin: "linkedin.com/in/username",
  github: "github.com/username",
  summary:
    "Graduate / undergraduate student interested in software engineering, data, and AI/ML.\n" +
    "Hands-on experience with projects in web development, data analysis, and/or machine learning.\n" +
    "Strong fundamentals in programming, algorithms, and problem-solving.",
  skills: [
    "Java",
    "Python",
    "JavaScript/TypeScript",
    "SQL",
    "React",
    "Node.js/Express",
    "Spring Boot or Django/Flask (basic)",
    "Git",
    "GitHub",
    "Data Structures & Algorithms",
    "OOP",
  ],
  experience: [
    {
      company: "Organization Name",
      role: "Intern / Part-time Role",
      location: "City, State",
      start: "Month YYYY",
      end: "Month YYYY",
      bullets: [
        "Worked on small features or bug fixes in an existing codebase.",
        "Collaborated with teammates and followed code review practices.",
        "Wrote simple tests or documentation for assigned tasks.",
      ],
    },
  ],
  projects: [
    {
      name: "Project Name — Short Tagline",
      link: "",
      stack: ["React", "Node.js", "PostgreSQL"],
      bullets: [
        "Built a web or data project using your main stack (e.g., React + API, or Python + SQL).",
        "Implemented key features like authentication, CRUD, or basic analysis/reporting.",
        "Deployed or demonstrated the project to classmates or online.",
      ],
    },
    {
      name: "Another Project Name — Short Tagline",
      link: "",
      stack: [],
      bullets: [
        "Describe what the project does and what you contributed.",
        "Mention technologies used and key results (e.g., performance, accuracy, adoption).",
      ],
    },
  ],
  education: [
    {
      school: "University Name",
      degree: "B.Tech / B.S. / M.S.",
      location: "City, State",
      grad: "Expected Month YYYY",
      details: [
        "GPA: X.XX/4.00 (if strong)",
        "Relevant Coursework: Algorithms, Data Structures, Operating Systems, Databases, Machine Learning",
      ],
    },
  ],
  certifications: [],
};
