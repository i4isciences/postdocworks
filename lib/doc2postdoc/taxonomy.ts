// Doc2Postdoc 12-Pillar subject-matching taxonomy.
// Source: i4iSciences Doc2Postdoc_Concept_and_Plan.docx, "5. Subject-Matching Taxonomy — 12 Pillars".
// 3-tier structure: Pillar -> Field (Level 2, representative set) -> Specialization (Level 3, open/extensible).
// `crossTagHint` reproduces the doc's own dual-tag notes; it is a suggestion shown to the member,
// never applied automatically — the doc only gives illustrative examples, not a complete mapping.

export type Pillar = {
  name: string;
  fields: string[];
  crossTagHint?: string;
};

export const DOC2POSTDOC_PILLARS: Pillar[] = [
  { name: "Mathematics & Statistics", fields: ["Pure Math", "Applied Math", "Statistics", "Probability Theory", "Computational Math"] },
  { name: "Physical Sciences", fields: ["Physics", "Chemistry", "Astronomy & Astrophysics", "Materials Science"] },
  {
    name: "Life Sciences & Biology",
    fields: ["Molecular Biology", "Cell Biology", "Genetics & Genomics", "Microbiology", "Virology", "Immunology", "Neuroscience", "Ecology & Evolutionary Biology", "Biochemistry"],
    crossTagHint: "Virology and Immunology are often cross-tagged with Medicine & Health Sciences.",
  },
  { name: "Medicine & Health Sciences", fields: ["Clinical Medicine", "Surgery", "Dermatology", "Cardiology", "Oncology", "Psychiatry", "Public Health", "Pharmacy", "Nursing", "Dentistry"] },
  {
    name: "Engineering & Applied Sciences",
    fields: ["Mechanical", "Civil & Structural", "Chemical", "Electrical", "Biomedical", "Aerospace", "Materials Engineering", "Robotics"],
    crossTagHint: "Robotics is often cross-tagged with Computer Science & Data Science.",
  },
  { name: "Computer Science & Data Science", fields: ["Artificial Intelligence", "Software Systems", "Computational Theory", "Data Science", "Cybersecurity", "Human-Computer Interaction"] },
  { name: "Earth, Environmental & Planetary Sciences", fields: ["Geology", "Climate Science", "Oceanography", "Atmospheric Science", "Planetary Science"] },
  { name: "Agricultural, Food & Veterinary Sciences", fields: ["Agronomy", "Food Science", "Veterinary Medicine", "Animal Science", "Horticulture"] },
  { name: "Social Sciences", fields: ["Sociology", "Psychology", "Economics", "Political Science", "Anthropology", "Education Research"] },
  {
    name: "Humanities & Archaeology",
    fields: ["History", "Philosophy", "Literature", "Linguistics", "Archaeology", "Religious Studies"],
    crossTagHint: "Archaeology is often cross-tagged with Earth, Environmental & Planetary Sciences.",
  },
  {
    name: "Architecture, Design & the Built Environment",
    fields: ["Architecture", "Urban Planning", "Landscape Architecture", "Interior Design"],
    crossTagHint: "This pillar is often cross-tagged with Engineering & Applied Sciences.",
  },
  { name: "Law, Business & Public Policy", fields: ["Law", "Business/Management", "Public Policy", "Public Administration"] },
];

export const DOC2POSTDOC_PILLAR_NAMES = DOC2POSTDOC_PILLARS.map((pillar) => pillar.name);

export function fieldsForPillar(pillarName: string): string[] {
  return DOC2POSTDOC_PILLARS.find((pillar) => pillar.name === pillarName)?.fields ?? [];
}

export function isValidPillar(value: string): boolean {
  return DOC2POSTDOC_PILLAR_NAMES.includes(value);
}
