"use client";

import { useState } from "react";
import type { EncyclopediaQuiz } from "@/lib/encyclopedia";
import { updateEncyclopediaProgress } from "@/lib/encyclopediaProgress";
import { sounds } from "@/lib/sounds";

type Props = {
  slug: string;
  questions: EncyclopediaQuiz[];
};

function arrangeOptions(
  options: string[],
  questionIndex: number,
  slug: string,
) {
  const offset = (slug.length + questionIndex) % options.length;
  const indexed = options.map((option, originalIndex) => ({
    option,
    originalIndex,
  }));
  return [...indexed.slice(offset), ...indexed.slice(0, offset)];
}

export function KnowledgeCheck({ slug, questions }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [markedComplete, setMarkedComplete] = useState(false);
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.reduce(
    (count, question, index) => count + (answers[index] === question.answer ? 1 : 0),
    0,
  );

  const answerQuestion = (questionIndex: number, answerIndex: number) => {
    if (answers[questionIndex] !== undefined) return;
    const correct = questions[questionIndex]?.answer === answerIndex;
    setAnswers((current) => ({ ...current, [questionIndex]: answerIndex }));
    if (correct) sounds.success();
    else sounds.tap();
  };

  const finished = answeredCount === questions.length;

  return (
    <section className="knowledge-check" aria-labelledby="knowledge-title">
      <div className="knowledge-heading">
        <span aria-hidden>🧠</span>
        <div>
          <small>Merak kontrolü</small>
          <h2 id="knowledge-title">Şimdi fikri başka bir örnekte kullanalım</h2>
          <p>Yanlış cevap ceza değildir; açıklama yeni bir gözlem ipucudur.</p>
        </div>
      </div>

      <div className="knowledge-questions">
        {questions.map((question, questionIndex) => {
          const selected = answers[questionIndex];
          const answered = selected !== undefined;
          const arrangedOptions = arrangeOptions(
            question.options,
            questionIndex,
            slug,
          );
          const feedbackId = `knowledge-feedback-${questionIndex}`;
          return (
            <fieldset key={question.question} className="knowledge-question">
              <legend>
                <span>{questionIndex + 1}</span>
                {question.question}
              </legend>
              <div className="knowledge-options">
                {arrangedOptions.map(({ option, originalIndex }, displayIndex) => {
                  const isCorrect = originalIndex === question.answer;
                  const isSelected = originalIndex === selected;
                  const className = answered
                    ? isCorrect
                      ? "correct"
                      : isSelected
                        ? "selected-wrong"
                        : ""
                    : "";
                  return (
                    <button
                      type="button"
                      className={className}
                      key={`${originalIndex}-${option}`}
                      disabled={answered}
                      aria-describedby={answered ? feedbackId : undefined}
                      aria-label={
                        answered
                          ? `${option}. ${isCorrect ? "Doğru cevap" : isSelected ? "Seçtiğin cevap" : "Diğer seçenek"}.`
                          : option
                      }
                      onClick={() => answerQuestion(questionIndex, originalIndex)}
                    >
                      <span aria-hidden>{answered && isCorrect ? "✓" : String.fromCharCode(65 + displayIndex)}</span>
                      {option}
                    </button>
                  );
                })}
              </div>
              {answered ? (
                <p
                  className={selected === question.answer ? "answer-note correct" : "answer-note"}
                  id={feedbackId}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <strong>{selected === question.answer ? "Harika gözlem!" : "Birlikte bakalım:"}</strong>{" "}
                  {question.explanation}
                </p>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {finished ? (
        <div className="knowledge-result" role="status">
          <span aria-hidden>{correctCount === questions.length ? "🏅" : "🌱"}</span>
          <div>
            <strong>{correctCount} / {questions.length} doğru yanıt</strong>
            <p>
              {correctCount === questions.length
                ? "Fikri yeni örneklere taşıdın. Bu keşfi tamamladın!"
                : "Açıklamaları bir kez daha anlatmayı dene; bilim tekrar gözlemle güçlenir."}
            </p>
          </div>
          <button
            type="button"
            disabled={markedComplete}
            onClick={() => {
              updateEncyclopediaProgress(slug, { complete: true });
              setMarkedComplete(true);
              sounds.win();
            }}
          >
            {markedComplete ? "Keşif tamamlandı ✓" : "Keşfi tamamla ✓"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
