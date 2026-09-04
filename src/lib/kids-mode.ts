const KIDS_GRADES = new Set([
  "الأول الابتدائي",
  "الثاني الابتدائي",
  "الثالث الابتدائي",
]);

const LEGACY_GRADE_ALIASES: Record<string, string> = {
  "Grade 1": "الأول الابتدائي",
  "Grade 2": "الثاني الابتدائي",
  "Grade 3": "الثالث الابتدائي",
  "Grade 4": "الرابع الابتدائي",
  "Grade 5": "الخامس الابتدائي",
  "Grade 6": "السادس الابتدائي",
  "Grade 7": "الأول الإعدادي",
  "Grade 8": "الثاني الإعدادي",
  "Grade 9": "الثالث الإعدادي",
  "Grade 10": "الأول الثانوي",
  "Grade 11": "الثاني الثانوي",
  "Grade 12": "الثالث الثانوي",
};

export function normalizeGrade(grade: string | null | undefined) {
  if (!grade) return null;
  return LEGACY_GRADE_ALIASES[grade] ?? grade;
}

export function isKidsGrade(grade: string | null | undefined) {
  return normalizeGrade(grade) === "الأول الابتدائي";
}

export function hasUnlimitedAttempts(grade: string | null | undefined) {
  const normalized = normalizeGrade(grade);
  return !!normalized && KIDS_GRADES.has(normalized);
}

export const MAX_QUIZ_ATTEMPTS = 3;

export function getMaxAttempts(grade: string | null | undefined): number | null {
  return hasUnlimitedAttempts(grade) ? null : MAX_QUIZ_ATTEMPTS;
}
