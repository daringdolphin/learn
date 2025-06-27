export interface SyllabusReferenceSubpart {
  topics_tested: string[];
  syllabus_content: string[];
  learning_outcomes: string[];
}

export interface SyllabusReferencePart {
  topics_tested: string[];
  syllabus_content: string[];
  learning_outcomes: string[];
  subparts?: {
    [subpartKey: string]: SyllabusReferenceSubpart;
  };
}

export interface SyllabusReference {
  [partKey: string]: SyllabusReferencePart;
} 