// الصفوف اللي بتاخد تجربة "وضع مرح" (تصميم أبسط وأكبر وأكتر حيوية للأطفال الصغيرين)
const KIDS_GRADES = new Set([
  "الأول الابتدائي",
  "الثاني الابتدائي",
  "الثالث الابتدائي",
]);

// وضع "التصميم المرح الكامل" (ألوان + شخصية مبتسمة) بيتفعل بس في الأول الابتدائي
export function isKidsGrade(grade: string | null | undefined) {
  return grade === "الأول الابتدائي";
}

// محاولات الكويز غير المحدودة بتبقى للصفوف الصغيرة (الأول لحد الثالث الابتدائي)
export function hasUnlimitedAttempts(grade: string | null | undefined) {
  return !!grade && KIDS_GRADES.has(grade);
}

export const MAX_QUIZ_ATTEMPTS = 3;

// null = محاولات غير محدودة
export function getMaxAttempts(grade: string | null | undefined): number | null {
  return hasUnlimitedAttempts(grade) ? null : MAX_QUIZ_ATTEMPTS;
}
