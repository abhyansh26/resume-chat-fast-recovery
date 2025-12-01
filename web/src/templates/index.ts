import type { Resume } from "../types/resume";

export const modernATS: Resume = {
  name: "Your Name",
  title: "Data Engineer",
  contact: {
    email: "you@email.com",
    phone: "(123) 456-7890",
    location: "College Park, MD",
    links: [{ label: "LinkedIn", url: "https://linkedin.com/in/your" }, { label: "GitHub", url: "https://github.com/your" }]
  },
  summary: "Data engineer with experience building ETL pipelines, APIs, and cloud-native workloads on AWS.",
  sections: [
    { kind: "Skills", groups: [
      { label: "Languages", items: ["Python", "SQL", "Java"] },
      { label: "Frameworks", items: ["FastAPI", "Spring Boot", "React"] },
      { label: "Cloud", items: ["AWS Lambda", "DynamoDB", "S3", "API Gateway"] }
    ]},
    { kind: "Experience", items: [
      {
        company: "7-Eleven GSC",
        role: "Software Engineer",
        start: "Sep 2022",
        end: "Jun 2024",
        location: "Bengaluru, IN",
        bullets: [
          "Built high-performance REST APIs used across 10K+ stores; improved response time and reduced AWS cost by 3%.",
          "Integrated native MongoDB driver in top services to enhance CRUD throughput.",
        ]
      }
    ]},
    { kind: "Projects", items: [
      { name: "Resume Chat (AWS serverless)",
        tech: ["FastAPI", "Lambda", "DynamoDB", "S3", "CloudFront"],
        bullets: [
          "Implemented fast session recovery (DDB hot + S3 cold snapshots).",
          "Integrated Groq for smart bullet rewrites."
        ] }
    ]},
    { kind: "Education", items: [
      { school: "University of Maryland, College Park", degree: "M.Eng., Software Engineering (May 2026)", start: "2024", end: "2026",
        details: ["GPA: 3.9/4.0 (expected)", "Relevant: Cloud, Software Design & Architecture"] }
    ]}
  ]
};

export const classic: Resume = {
  ...modernATS,
  title: "Software Engineer",
  summary: undefined
};

export const templates = [
  { id: "modern-ats", name: "Modern ATS (1-page)", data: modernATS },
  { id: "classic", name: "Classic (no summary)", data: classic },
];
