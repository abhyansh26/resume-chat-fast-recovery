export type Link = { label: string; url: string };

export type ExperienceItem = {
  company: string;
  role: string;
  start: string; // e.g., "Sep 2022"
  end: string;   // e.g., "Jun 2024" or "Present"
  location?: string;
  bullets: string[];
};

export type EducationItem = {
  school: string;
  degree: string;
  start: string;
  end: string;
  details?: string[]; // GPA, coursework, etc.
};

export type ProjectItem = {
  name: string;
  tech?: string[];
  bullets: string[];
};

export type SkillsGroup = { label: string; items: string[] };

export type Resume = {
  name: string;
  title?: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links?: Link[];
  };
  summary?: string;
  sections: Array<
    | { kind: "Skills"; groups: SkillsGroup[] }
    | { kind: "Experience"; items: ExperienceItem[] }
    | { kind: "Projects"; items: ProjectItem[] }
    | { kind: "Education"; items: EducationItem[] }
    | { kind: "Achievements"; items: string[] }
  >;
};
