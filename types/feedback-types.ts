export interface AnalysisResult {
  examSkills: ExamSkills
  conceptualUnderstanding: ConceptualUnderstanding
}

export interface ExamSkills {
  content: string // Markdown-formatted feedback for exam skills
}

export interface ConceptualUnderstanding {
  content: string // Markdown-formatted feedback for conceptual understanding
}

/*
Example response structure:
{
  "examSkills": {
    "content": "## Missing Keywords\n- **absence of water** - Essential for explaining the experimental setup\n- **calcium chloride as drying agent** - Specify the role in the process\n\n## Phrasing Improvements\n- Instead of 'rust forms', write 'iron rusts due to the presence of oxygen and water'\n- Add explanation for why boiled water is used\n\n## Mark Recovery Actions\n- Add the specific chemical equation: `4Fe + 3O₂ + 6H₂O → 4Fe(OH)₃`\n- Explain the role of each test tube in the experiment"
  },
  "conceptualUnderstanding": {
    "content": "## Misconceptions Detected\n- **Confused sacrificial protection mechanism** - You mentioned zinc protects iron, but didn't explain the electron transfer process\n\n## Knowledge Gaps\n- **Reactivity series position** - Review where nickel sits relative to iron in the reactivity series\n- **Oxidation states** - Understanding of Fe²⁺ vs Fe³⁺ in rust formation\n\n## Concept Clarifications\n> **Key Point**: Zinc protects iron because it is more reactive and preferentially oxidizes\n\n- The process involves zinc losing electrons more readily than iron\n- This creates a protective electrochemical barrier around the iron"
  }
}
*/ 