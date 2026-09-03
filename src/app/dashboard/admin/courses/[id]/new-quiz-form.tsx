"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type QuestionType = "multiple_choice" | "true_false" | "complete";

type Question = {
  type: QuestionType;
  question: string;
  options: string[];
  correctIndex: number;
};

function emptyQuestion(): Question {
  return { type: "multiple_choice", question: "", options: ["", ""], correctIndex: 0 };
}

export default function NewQuizForm({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(i: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((qs) => qs.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q
    ));
  }

  function setQuestionType(qi: number, type: QuestionType) {
    setQuestions((qs) => qs.map((q, idx) => {
      if (idx !== qi) return q;
      if (type === "true_false") return { ...q, type, options: ["صح", "غلط"], correctIndex: 0 };
      if (type === "complete") return { ...q, type, options: [""], correctIndex: 0 };
      return { ...q, type, options: ["", ""], correctIndex: 0 };
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const invalid = questions.some((q) => {
      if (!q.question.trim()) return true;
      if (q.type === "complete") return !q.options[0]?.trim();
      return q.options.length < 2 || q.options.some((o) => !o.trim());
    });
    if (!quizTitle.trim() || invalid) {
      setError("راجع عنوان الكويز وكل سؤال وتأكد من كتابة الإجابة الصحيحة.");
      setLoading(false);
      return;
    }

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes").insert({ lesson_id: lessonId, title: quizTitle.trim() }).select().single();

    if (quizError || !quiz) {
      setError(quizError?.message ?? "حصل خطأ");
      setLoading(false);
      return;
    }

    const rows = questions.map((q, i) => ({
      quiz_id: quiz.id,
      question: q.question.trim(),
      options: q.options,
      correct_index: q.correctIndex,
      question_type: q.type,
      position: i,
    }));

    const { error: qError } = await supabase.from("quiz_questions").insert(rows);
    setLoading(false);
    if (qError) {
      setError(qError.message);
      return;
    }
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="text-sm text-green-text border border-line rounded-md px-3.5 py-1.5">+ إضافة كويز للدرس ده</button>;
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-line mt-4 pt-4 flex flex-col gap-4">
      <input className="w-full px-3 py-2.5 border border-line rounded-md bg-paper text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-green" placeholder="اسم الكويز" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} required />

      {questions.map((q, qi) => (
        <div key={qi} className="bg-paper rounded-lg p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-ink-soft"><input type="radio" name={`type-${qi}`} checked={q.type === "multiple_choice"} onChange={() => setQuestionType(qi, "multiple_choice")} />اختيار من متعدد</label>
            <label className="flex items-center gap-1.5 text-xs text-ink-soft"><input type="radio" name={`type-${qi}`} checked={q.type === "true_false"} onChange={() => setQuestionType(qi, "true_false")} />صح / غلط</label>
            <label className="flex items-center gap-1.5 text-xs text-ink-soft"><input type="radio" name={`type-${qi}`} checked={q.type === "complete"} onChange={() => setQuestionType(qi, "complete")} />Complete / أكمل الفراغ</label>
          </div>

          <input className="w-full px-3 py-2 border border-line rounded-md bg-surface text-sm" placeholder={q.type === "complete" ? `السؤال ${qi + 1} — اكتب ______ مكان الفراغ` : `السؤال ${qi + 1}`} value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} required />

          {q.type === "complete" ? (
            <input className="w-full px-3 py-2 border border-line rounded-md bg-surface text-sm" placeholder="الإجابة الصحيحة" value={q.options[0] ?? ""} onChange={(e) => updateOption(qi, 0, e.target.value)} required />
          ) : q.type === "true_false" ? (
            q.options.map((opt, oi) => (
              <label key={oi} className="flex items-center gap-2">
                <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => updateQuestion(qi, { correctIndex: oi })} />
                <span className="flex-1 px-3 py-2 border border-line rounded-md bg-surface text-sm text-ink-soft">{opt}</span>
              </label>
            ))
          ) : (
            q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => updateQuestion(qi, { correctIndex: oi })} />
                <input className="flex-1 px-3 py-2 border border-line rounded-md bg-surface text-sm" placeholder={`اختيار ${oi + 1}`} value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} required />
              </div>
            ))
          )}

          {q.type === "multiple_choice" && q.options.length < 4 && (
            <button type="button" className="text-xs text-ink-soft" onClick={() => updateQuestion(qi, { options: [...q.options, ""] })}>+ إضافة اختيار</button>
          )}
        </div>
      ))}

      <button type="button" className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5 self-start" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>+ إضافة سؤال</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="bg-green text-white text-sm font-medium py-2.5 px-5 rounded-md disabled:opacity-60">{loading ? "جاري الحفظ…" : "حفظ الكويز"}</button>
        <button type="button" className="text-sm text-ink-soft" onClick={() => setOpen(false)}>إلغاء</button>
      </div>
    </form>
  );
}
