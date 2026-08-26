// Server-only module: the full CV payload. It is returned exclusively by the
// gated getCvContent server function, so it never ships to locked visitors.

import type { CvData } from "./cv-types";

export const cvData: CvData = {
  name: "Ing. Krisztián Virág",
  title: "Product Manager",
  tagline:
    "From designing load-bearing structures to shaping the software that designs them — I build products on an engineer's foundation.",
  location: "Bratislava, Slovak Republic",
  email: "krisz.vir@gmail.com",
  phone: "+421 915 433 257",
  birthDate: "26. 5. 1994",
  about: [
    "I started my career as a construction engineer, modelling prefabricated structures and preparing workshop documentation. Today I work as a product manager at Allplan — the very class of software I used to rely on at the drawing board.",
    "That path gives me a rare vantage point: I know the user's daily reality first-hand, and I pair it with data-driven discovery, competitive analysis and end-to-end product lifecycle management to ship outcomes that matter.",
  ],
  experience: [
    {
      role: "Product Manager",
      company: "Allplan Slovensko s. r. o.",
      location: "Bratislava, Slovak Republic",
      period: "Jan 2025 — Present",
      current: true,
      bullets: [
        "Responsible for continuous product discovery and validation: communication with external and internal stakeholders, monitoring and analysing the competitiveness of the product and overall market trends, analysing usage and customer data and feedback.",
        "Preparation of end-to-end development proposals blending data-driven decision-making with user-centered design to deliver measurable business outcomes and exceptional customer satisfaction.",
        "Managing the full product lifecycle from concept to launch, ensuring budget and feature requirements stay under control.",
        "Led the development of solutions strengthening the product portfolio on the market, with a measurable increase in customer satisfaction and productivity, while reducing technical debt and code complexity.",
      ],
    },
    {
      role: "Product Owner",
      company: "Allplan Slovensko s. r. o.",
      location: "Bratislava, Slovak Republic",
      period: "Nov 2022 — Dec 2024",
      bullets: [
        "Prepared comprehensive Statements of Work (SOWs) defining project scope, deliverables, timelines and resource requirements.",
        "Collaborated with cross-functional teams and stakeholders to ensure clear alignment on objectives, technical specifications and expected outcomes.",
        "Developed detailed product development plans covering design, implementation, testing and deployment phases, ensuring adherence to Agile and hybrid methodologies.",
      ],
    },
    {
      role: "Construction Engineer",
      company: "BVK-PRO s. r. o.",
      location: "Šamorín, Slovak Republic",
      period: "Aug 2019 — Oct 2022",
      bullets: [
        "Modelled load-bearing structures of buildings, with a focus on prefabricated structures.",
        "Prepared and inspected formwork and reinforcement plans for workshop documentation.",
        "Prepared project documentation for building permits and construction.",
      ],
    },
  ],
  skills: [
    { name: "Allplan", level: "Expert", score: 96 },
    { name: "Microsoft Office", level: "Advanced", score: 82 },
    { name: "Jira (Atlassian)", level: "Skillful", score: 68 },
    { name: "Confluence (Atlassian)", level: "Skillful", score: 68 },
    { name: "Python", level: "Basic", score: 34 },
  ],
  languages: [
    { name: "English", level: "Proficiency — C2" },
    { name: "Hungarian", level: "Proficiency — C2" },
    { name: "Slovak", level: "Proficiency — C2" },
  ],
  education: [
    {
      school: "Faculty of Civil Engineering, Slovak University of Technology",
      field: "Building Construction and Design",
      period: "2017 — 2019",
      location: "Bratislava, Slovak Republic",
      note: "Engineer's study programme (Ing.)",
    },
    {
      school: "Faculty of Civil Engineering, Slovak University of Technology",
      field: "Building Construction and Architecture",
      period: "2013 — 2017",
      location: "Bratislava, Slovak Republic",
      note: "Bachelor's study programme (Bc.)",
    },
    {
      school: "Imre Madách Gymnasium",
      field: "Hungarian language of education",
      period: "2009 — 2013",
      location: "Šamorín, Slovak Republic",
    },
  ],
  interests:
    "I learned the basics of Python, which I use in my professional life for simple data analysis tasks. In my free time I use the same skill to create utility applications and mini games, such as Sudoku or Tic-Tac-Toe.",
  interestTags: ["Python", "Data analysis", "Side projects", "Sudoku", "Tic-Tac-Toe"],
  drivingLicense: "B",
};
