export type Lang = "ar" | "en";

export const dictionary = {
  siteName: { ar: "أثر", en: "Athar" },
  courses: { ar: "الكورسات", en: "Courses" },
  manageUsers: { ar: "إدارة المستخدمين", en: "Manage Users" },
  manageCourses: { ar: "إدارة الكورسات", en: "Manage Courses" },
  myChildren: { ar: "متابعة الأبناء", en: "My Children" },
  myChildrenCardTitle: { ar: "متابعة الأبناء", en: "My children" },
  myChildrenCardDesc: {
    ar: "شوف درجات أبنائك في كل الكويزات في مكان واحد.",
    en: "See your children's scores across all quizzes in one place.",
  },
  logout: { ar: "تسجيل الخروج", en: "Log out" },
  welcome: { ar: "أهلًا بيك", en: "Welcome" },
  backToDashboard: { ar: "رجوع للداشبورد", en: "Back to dashboard" },
  back: { ar: "رجوع", en: "Back" },
  coursesCardTitle: { ar: "الكورسات", en: "Courses" },
  coursesCardDesc: {
    ar: "اتفرج على الدروس والفيديوهات وحل الكويزات.",
    en: "Watch lessons and videos, and take quizzes.",
  },
  manageCoursesCardTitle: { ar: "إدارة الكورسات", en: "Manage courses" },
  manageCoursesCardDesc: {
    ar: "أضف كورسات ودروس وكويزات، وشوف نتائج الطلاب.",
    en: "Add courses, lessons, and quizzes, and see student results.",
  },
  student: { ar: "طالب", en: "Student" },
  teacher: { ar: "معلم", en: "Teacher" },
  parent: { ar: "ولي أمر", en: "Parent" },
  admin: { ar: "أدمن", en: "Admin" },
  login: { ar: "تسجيل الدخول", en: "Log in" },
  language: { ar: "English", en: "العربية" },
} as const;

export type DictionaryKey = keyof typeof dictionary;

export function translate(key: DictionaryKey, lang: Lang): string {
  return dictionary[key][lang];
}
