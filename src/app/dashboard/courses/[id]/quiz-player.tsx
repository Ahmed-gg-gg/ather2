"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  type: "multiple_choice" | "true_false";
};

type Attempt = { score: number; total: number };

export default function QuizPlayer({
  quizId,
  title,
  questions,
  attempts: initialAttempts,
  maxAttempts,
  kidsMode,
}: {
  quizId: string;
  title: string;
  questions: Question[];
  attempts: Attempt[];
  maxAttempts: number | null;
  kidsMode: boolean;
}) {
  const supabase = createClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts);
  const [retrying, setRetrying] = useState(attempts.length === 0);
  const [submitting, setSubmitting] = useState(false);

  const attemptsUsed = attempts.length;
  const canRetry = maxAttempts === null || attemptsUsed < maxAttempts;

  const bestAttempt = attempts.reduce<Attempt | null>((best, a) => {
    if (!best) return a;
    return a.score / a.total > best.score / best.total ? a : best;
  }, null);

  async function handleSubmit() {
    setSubmitting(true);

    let score = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) score++;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      user_id: user?.id,
      score,
      total: questions.length,
    });

    setAttempts((a) => [...a, { score, total: questions.length }]);
    setAnswers({});
    setRetrying(false);
    setSubmitting(false);
  }

  if (!retrying) {
    const ratio = bestAttempt ? bestAttempt.score / bestAttempt.total : 0;
    const celebrate = kidsMode && ratio >= 0.6;

    return (
      <div
        className={
          kidsMode
            ? "border-t-4 border-[#ffd166] pt-4 mt-2"
            : "border-t border-line pt-4 mt-2"
        }
      >
        <p
          className={
            kidsMode
              ? "text-base font-bold text-[#7a3fa0] mb-2"
              : "text-sm font-medium text-ink mb-1"
          }
        >
          {title}
        </p>

        {kidsMode ? (
          <div className="flex items-center gap-3">
            <span
              className={`text-4xl ${celebrate ? "kids-clap" : ""}`}
              aria-hidden
            >
              {celebrate ? "🥳" : "🙂"}
            </span>
            <div>
              <span className="inline-block text-sm font-bold bg-[#d9f7be] text-[#2b6100] px-3 py-1.5 rounded-full">
                نتيجتك: {bestAttempt?.score} من {bestAttempt?.total} ⭐
              </span>
              <p className="text-xs text-[#7a3fa0] mt-1">
                {celebrate ? "برافو عليك! شاطر جدًا 🎉" : "محاولة حلوة! جرب تاني 💪"}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-xs bg-green-light text-green-text px-2.5 py-1 rounded-full">
            أعلى نتيجة: {bestAttempt?.score} من {bestAttempt?.total}
          </span>
        )}

        {attempts.length > 1 && (
          <p className="text-xs text-ink-faint mt-2">
            عدد المحاولات: {attemptsUsed}
            {maxAttempts !== null ? ` من ${maxAttempts}` : ""}
          </p>
        )}

        {canRetry ? (
          <button
            onClick={() => setRetrying(true)}
            className={
              kidsMode
                ? "mt-3 bg-[#ff8fab] text-white text-sm font-bold py-2.5 px-5 rounded-full shadow-md"
                : "mt-3 bg-green text-white text-sm font-medium py-2 px-5 rounded-md"
            }
          >
            {kidsMode ? "🔁 حاول تاني" : "إعادة المحاولة"}
          </button>
        ) : (
          <p className="text-xs text-ink-faint mt-3">
            خلصت المحاولات المتاحة ({maxAttempts}) لهذا الكويز.
          </p>
        )}
      </div>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div
      className={
        kidsMode
          ? "border-t-4 border-[#ffd166] pt-4 mt-2 space-y-4"
          : "border-t border-line pt-4 mt-2 space-y-4"
      }
    >
      <p
        className={
          kidsMode
            ? "text-base font-bold text-[#7a3fa0]"
            : "text-sm font-medium text-ink"
        }
      >
        {kidsMode ? "🎯 " : ""}
        {title}
      </p>
      {questions.map((q, qi) => (
        <div
          key={q.id}
          className={
            kidsMode
              ? "bg-[#fff8ec] border-2 border-[#ffd166] rounded-2xl p-4"
              : "bg-paper rounded-lg p-4"
          }
        >
          <p
            className={
              kidsMode
                ? "text-base font-bold text-[#7a3fa0] mb-3"
                : "text-sm text-ink mb-2"
            }
          >
            {qi + 1}. {q.question}
          </p>

          {kidsMode ? (
            <div
              className={
                q.type === "true_false"
                  ? "grid grid-cols-2 gap-2"
                  : "flex flex-col gap-2"
              }
            >
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={`text-sm font-bold py-3 px-4 rounded-2xl border-2 transition-colors ${
                      selected
                        ? "bg-[#7a3fa0] text-white border-[#7a3fa0]"
                        : "bg-white text-[#7a3fa0] border-[#ffd166]"
                    }`}
                  >
                    {q.type === "true_false" && (oi === 0 ? "✅ " : "❌ ")}
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className="flex items-center gap-2 text-sm text-ink-soft"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === oi}
                    onChange={() =>
                      setAnswers((a) => ({ ...a, [q.id]: oi }))
                    }
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className={
          kidsMode
            ? "bg-[#ff8fab] text-white text-base font-bold py-3 px-6 rounded-full shadow-md disabled:opacity-50"
            : "bg-green text-white text-sm font-medium py-2 px-5 rounded-md disabled:opacity-50"
        }
      >
        {submitting
          ? "جاري التصحيح…"
          : kidsMode
          ? "🚀 سلّم إجاباتك"
          : "تسليم الإجابات"}
      </button>
    </div>
  );
}
