"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Question = { id: string; question: string; options: string[]; correctIndex: number; correctAnswer?: string | null; type: "multiple_choice" | "true_false" | "complete" };
type Attempt = { score: number; total: number };

export default function QuizPlayer({ quizId, title, questions, attempts: initialAttempts, maxAttempts, kidsMode }: { quizId: string; title: string; questions: Question[]; attempts: Attempt[]; maxAttempts: number | null; kidsMode: boolean }) {
  const supabase = createClient();
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [attempts, setAttempts] = useState(initialAttempts);
  const [retrying, setRetrying] = useState(initialAttempts.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRetry = maxAttempts === null || attempts.length < maxAttempts;
  const best = attempts.reduce<Attempt | null>((b, a) => !b || a.score / a.total > b.score / b.total ? a : b, null);

  async function submit() {
    setSubmitting(true); setError(null);
    let score = 0;
    for (const q of questions) {
      const answer = answers[q.id];
      if (q.type === "complete") {
        const expected = (q.correctAnswer ?? q.options[0] ?? "").trim().toLocaleLowerCase();
        if (String(answer ?? "").trim().toLocaleLowerCase() === expected) score++;
      } else if (answer === q.correctIndex) score++;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("quiz_attempts").insert({ quiz_id: quizId, user_id: user?.id, score, total: questions.length });
    if (insertError) { setError("تعذر حفظ النتيجة. حاول مرة أخرى."); setSubmitting(false); return; }
    setAttempts((a) => [...a, { score, total: questions.length }]); setAnswers({}); setRetrying(false); setSubmitting(false);
  }

  if (!retrying) return <div className="border-t border-line pt-4 mt-2">
    <p className={kidsMode ? "text-base font-bold text-[#7a3fa0] mb-2" : "text-sm font-medium text-ink mb-1"}>{title}</p>
    <span className="inline-block text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">أعلى نتيجة: {best?.score} من {best?.total}</span>
    <p className="text-xs text-ink-faint mt-2">عدد المحاولات: {attempts.length}{maxAttempts !== null ? ` من ${maxAttempts}` : ""}</p>
    {canRetry ? <button onClick={() => setRetrying(true)} className="mt-3 bg-green text-white text-sm font-medium py-2 px-5 rounded-md">إعادة المحاولة</button> : <p className="text-xs text-ink-faint mt-3">خلصت المحاولات المتاحة.</p>}
  </div>;

  const allAnswered = questions.every((q) => answers[q.id] !== undefined && String(answers[q.id]).trim() !== "");
  return <div className="border-t border-line pt-4 mt-2 space-y-4">
    <p className={kidsMode ? "text-base font-bold text-[#7a3fa0]" : "text-sm font-medium text-ink"}>{kidsMode ? "🎯 " : ""}{title}</p>
    {questions.map((q, qi) => <div key={q.id} className={kidsMode ? "bg-[#fff8ec] border-2 border-[#ffd166] rounded-2xl p-4" : "bg-paper rounded-lg p-4"}>
      <p className="text-sm text-ink mb-3">{qi + 1}. {q.question}</p>
      {q.type === "complete" ? <input value={String(answers[q.id] ?? "")} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="اكتب الإجابة هنا" className="w-full px-3 py-2 border border-line rounded-md bg-surface text-sm" /> : <div className="space-y-1.5">{q.options.map((opt, oi) => <label key={oi} className="flex items-center gap-2 text-sm text-ink-soft"><input type="radio" name={q.id} checked={answers[q.id] === oi} onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} />{opt}</label>)}</div>}
    </div>)}
    {error && <p className="text-sm text-red-600">{error}</p>}
    <button onClick={submit} disabled={!allAnswered || submitting} className="bg-green text-white text-sm font-medium py-2 px-5 rounded-md disabled:opacity-50">{submitting ? "جاري التصحيح…" : "تسليم الإجابات"}</button>
  </div>;
}
