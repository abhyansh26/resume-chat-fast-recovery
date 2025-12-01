// web/src/components/TemplatePicker.tsx
import React from "react";

type TemplateId = "swe" | "data" | "intern";

interface TemplateDef {
  id: TemplateId;
  label: string;
  description: string;
  body: string;
}

// 🔹 Helper to build multiline template strings cleanly
function lines(arr: string[]): string {
  return arr.join("\n");
}

// 🔹 Template 1: Tech SWE-focused resume (ATS-friendly, single column)
const SWE_TEMPLATE: string = lines([
  "YOUR NAME",
  "City, State · email@example.com · (555) 555-5555 · linkedin.com/in/username · github.com/username",
  "",
  "SUMMARY",
  "- Software Engineer with experience building backend services, REST APIs, and cloud-native applications.",
  "- Comfortable with Java, Python, JavaScript/TypeScript, SQL, and modern frameworks like Spring Boot and React.",
  "- Strong focus on reliability, performance, and writing clean, maintainable code.",
  "",
  "SKILLS",
  "- Languages: Java, Python, JavaScript/TypeScript, SQL",
  "- Frameworks: Spring Boot, Node.js/Express, React",
  "- Cloud: AWS (Lambda, API Gateway, DynamoDB, S3), CI/CD (GitHub Actions)",
  "- Other: Git, REST APIs, Microservices, Docker, Agile/Scrum",
  "",
  "EXPERIENCE",
  "Company Name — Software Engineer",
  "City, State  ·  Month YYYY – Month YYYY",
  "- Built and maintained backend services using Java/Spring Boot and REST APIs consumed by web and mobile clients.",
  "- Optimized database queries and caching, improving API response times and reducing cloud cost.",
  "- Collaborated with cross-functional teams (Product, QA, DevOps) to deliver features on time.",
  "",
  "Company Name — Software Engineer Intern",
  "City, State  ·  Month YYYY – Month YYYY",
  "- Implemented new features and bug fixes in a production microservice using Java or Python.",
  "- Wrote unit and integration tests, increasing code coverage and catching regressions early.",
  "- Participated in code reviews and sprint ceremonies to align on technical approaches.",
  "",
  "PROJECTS",
  "Project Name — Short Tagline",
  "- Built a full-stack web app using React and a serverless backend (AWS Lambda, API Gateway, DynamoDB).",
  "- Implemented authentication, CRUD APIs, and optimized data access for low latency.",
  "- Deployed the app using CI/CD, monitored logs and metrics to ensure reliability.",
  "",
  "EDUCATION",
  "University Name — Degree (e.g., M.Eng. in Software Engineering)",
  "City, State  ·  Expected Month YYYY",
  "- GPA: X.XX/4.00 (if strong)",
  "- Relevant Coursework: Data Structures, Algorithms, Distributed Systems, Databases, Cloud Computing",
]);

// 🔹 Template 2: Data / Analytics-focused resume
const DATA_TEMPLATE: string = lines([
  "YOUR NAME",
  "City, State · email@example.com · (555) 555-5555 · linkedin.com/in/username · github.com/username",
  "",
  "SUMMARY",
  "- Data / Analytics professional with experience in Python, SQL, and building data pipelines and dashboards.",
  "- Skilled at translating business questions into analytical problems and clear, actionable insights.",
  "- Comfortable working with large datasets, ETL/ELT workflows, and visualization tools.",
  "",
  "SKILLS",
  "- Languages: Python, SQL",
  "- Analytics: Pandas, NumPy, scikit-learn, Jupyter",
  "- Data: SQL databases (PostgreSQL, MySQL), basic NoSQL, data modeling",
  "- Visualization: Power BI / Tableau / matplotlib / plotly",
  "- Cloud (optional): AWS (S3, Lambda, Glue, Redshift) or Azure/GCP equivalents",
  "",
  "EXPERIENCE",
  "Company Name — Data Analyst / Analytics Engineer",
  "City, State  ·  Month YYYY – Month YYYY",
  "- Built SQL and Python-based pipelines to clean, transform, and aggregate data for reporting.",
  "- Created dashboards and reports to summarize KPIs and trends for business stakeholders.",
  "- Partnered with product/operations teams to define metrics and track experiment results.",
  "",
  "Company Name — Data / Business Analyst Intern",
  "City, State  ·  Month YYYY – Month YYYY",
  "- Pulled data using SQL and prepared ad-hoc analyses to answer business questions.",
  "- Automated manual reporting tasks, reducing turnaround time and errors.",
  "- Documented assumptions, definitions, and logic for reproducibility.",
  "",
  "PROJECTS",
  "Analytics Project — Short Tagline",
  "- Analyzed dataset (e.g., customer behavior, transactions, or time-series) to answer a real-world question.",
  "- Built a model or rule-based segmentation in Python and evaluated performance.",
  "- Presented results using charts, a summary, and key recommendations.",
  "",
  "EDUCATION",
  "University Name — Degree (e.g., M.S. in Data Science / Analytics)",
  "City, State  ·  Expected Month YYYY",
  "- GPA: X.XX/4.00 (if strong)",
  "- Relevant Coursework: Statistics, Machine Learning, Data Mining, Database Systems, Data Visualization",
]);

// 🔹 Template 3: Intern / Early-career resume
const INTERN_TEMPLATE: string = lines([
  "YOUR NAME",
  "City, State · email@example.com · (555) 555-5555 · linkedin.com/in/username · github.com/username",
  "",
  "SUMMARY",
  "- Graduate / undergraduate student interested in software engineering, data, and AI/ML.",
  "- Hands-on experience with projects in web development, data analysis, and/or machine learning.",
  "- Strong fundamentals in programming, algorithms, and problem-solving.",
  "",
  "SKILLS",
  "- Languages: Java, Python, JavaScript/TypeScript, SQL",
  "- Frameworks: React, Node.js/Express, basic Spring Boot or Django/Flask",
  "- Tools: Git, GitHub, VS Code, basic Docker",
  "- Other: Data Structures & Algorithms, OOP, debugging, unit testing",
  "",
  "EXPERIENCE",
  "Internship / Part-time Role (if any)",
  "Organization Name — Role",
  "City, State  ·  Month YYYY – Month YYYY",
  "- Worked on small features or bug fixes in an existing codebase.",
  "- Collaborated with teammates and followed code review practices.",
  "- Wrote simple tests or documentation for assigned tasks.",
  "",
  "PROJECTS",
  "Project Name — Short Tagline",
  "- Built a web or data project using your main stack (e.g., React + API, or Python + SQL).",
  "- Implemented key features like authentication, CRUD, or basic analysis/reporting.",
  "- Deployed or demonstrated the project to classmates or online.",
  "",
  "Another Project Name — Short Tagline",
  "- Describe what the project does and what you contributed.",
  "- Mention technologies used and key results (e.g., performance, accuracy, adoption).",
  "",
  "EDUCATION",
  "University Name — Degree (e.g., B.Tech / B.S. / M.S.)",
  "City, State  ·  Expected Month YYYY",
  "- GPA: X.XX/4.00 (if strong)",
  "- Relevant Coursework: Algorithms, Data Structures, Operating Systems, Databases, Machine Learning",
]);

const templates: TemplateDef[] = [
  {
    id: "swe",
    label: "Tech SWE",
    description: "Backend / full-stack engineering focus",
    body: SWE_TEMPLATE,
  },
  {
    id: "data",
    label: "Data / Analytics",
    description: "Analytics, BI, data pipelines, ML-lite",
    body: DATA_TEMPLATE,
  },
  {
    id: "intern",
    label: "Intern / Early-career",
    description: "Student or first-role template",
    body: INTERN_TEMPLATE,
  },
];

export interface TemplatePickerProps {
  onApplyTemplate: (text: string) => void;
}

export default function TemplatePicker({ onApplyTemplate }: TemplatePickerProps) {
  return (
    <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/70 text-xs flex flex-wrap gap-2 items-center">
      <span className="text-slate-400 mr-1">Start from template:</span>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onApplyTemplate(t.body)}
          className="rounded-lg border border-slate-700/80 px-3 py-1 hover:bg-slate-800 text-slate-100"
          title={t.description}
        >
          {t.label}
        </button>
      ))}
      <span className="text-[10px] text-slate-500 ml-auto">
        You can edit everything after applying.
      </span>
    </div>
  );
}
