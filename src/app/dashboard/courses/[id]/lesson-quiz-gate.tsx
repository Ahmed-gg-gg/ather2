"use client";

import { useState } from "react";
import QuizPlayer from "./quiz-player";

type Question = { id: string; question: string; options: string[]; correctIndex: number; correctAnswer?: string | null; type: "multiple_choice" | "true_false" | "complete" };

export default function LessonQuizGate({ quizId, title, questions, attempts, maxAttempts, kidsMode }: { quizId: string; title: string; questions: Question[]; attempts: { score:number; total:number }[]; maxAttempts:number|null; kidsMode:boolean }) {
  const [revealed,setRevealed]=useState(false);
  if(!revealed&&attempts.length===0) return <div className="border-t border-line pt-4 mt-2"><button onClick={()=>setRevealed(true)} className={kidsMode?"bg-[#ff8fab] text-white text-base font-bold py-3 px-6 rounded-full shadow-md":"bg-green text-white text-sm font-medium py-2.5 px-5 rounded-md"}>{kidsMode?"🎉 يلا بينا نلعب!":"تم إنهاء الفيديو — ابدأ الاختبار"}</button></div>;
  return <QuizPlayer quizId={quizId} title={title} questions={questions} attempts={attempts} maxAttempts={maxAttempts} kidsMode={kidsMode}/>;
}
