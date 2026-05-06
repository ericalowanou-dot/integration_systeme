import { useMemo, useState, useCallback, useEffect } from "react";
import correctRaw from "../answers.json";

type AnswerLetter = "A" | "B" | "C" | "D";
type AnswersFile = Record<string, string>;

const OPTIONS: AnswerLetter[] = ["A", "B", "C", "D"];

const GREEN_CORRECT_STORAGE = "qcm-green-correct-letter";

function readGreenCorrectPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem(GREEN_CORRECT_STORAGE);
    if (v === null) return true;
    return v === "1" || v === "true";
  } catch {
    return true;
  }
}

function inferTotalQuestions(raw: AnswersFile): number {
  let max = 0;
  for (const k of Object.keys(raw)) {
    const n = Number.parseInt(k, 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  if (max > 0) return max;
  return Object.keys(raw).length;
}

function normalizeCorrect(
  raw: AnswersFile,
  total: number
): Record<number, AnswerLetter> {
  const out: Partial<Record<number, AnswerLetter>> = {};
  for (let num = 1; num <= total; num++) {
    const rawVal = raw[String(num)]?.toString().trim().toUpperCase() ?? "";
    const letter = rawVal.charAt(0);
    const valid =
      letter === "A" || letter === "B" || letter === "C" || letter === "D"
        ? letter
        : undefined;
    if (!valid) {
      console.warn(
        `[QCM] Réponse invalide pour la question ${num}: "${rawVal}" — valeur par défaut A`
      );
    }
    out[num] = (valid ?? "A") as AnswerLetter;
  }
  return out as Record<number, AnswerLetter>;
}

const css = `
:root {
  --bg: #0c0f14;
  --surface: #151a22;
  --surface-2: #1c2330;
  --border: rgba(255, 255, 255, 0.08);
  --text: #e8ecf1;
  --muted: #9aa3b2;
  --accent: #3b82f6;
  --accent-dim: rgba(59, 130, 246, 0.15);
  --success: #22c55e;
  --danger: #f97373;
  --radius: 14px;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  line-height: 1.45;
}

* {
  box-sizing: border-box;
}

html, body, #root {
  margin: 0;
  min-height: 100%;
}

body {
  background: radial-gradient(1200px 800px at 20% -10%, #1e293b 0%, transparent 55%),
    radial-gradient(900px 600px at 110% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
    var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.quiz-shell {
  max-width: min(920px, 100%);
  margin: 0 auto;
  padding: clamp(14px, 3vw, 28px);
  padding-bottom: max(28px, env(safe-area-inset-bottom));
}

.quiz-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.quiz-progress-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: clamp(14px, 3vw, 22px);
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--surface-2) 0%, var(--surface) 100%);
}

.quiz-progress-label {
  font-size: clamp(0.92rem, 2.8vw, 1.05rem);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.quiz-score-chip {
  font-size: clamp(0.85rem, 2.6vw, 0.98rem);
  color: var(--muted);
}

.quiz-score-chip strong {
  color: var(--text);
  font-weight: 700;
}

.progress-track {
  height: 10px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0 clamp(14px, 3vw, 22px) clamp(14px, 3vw, 22px);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent) 0%, #60a5fa 100%);
  border-radius: 999px;
  transition: width 0.35s ease;
}

.image-wrap {
  padding: clamp(10px, 2.5vw, 18px);
  background: #0a0d12;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: min(48vh, 520px);
}

.quiz-img {
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: min(58vh, 640px);
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #080a0e;
}

.image-fallback {
  color: var(--muted);
  text-align: center;
  padding: 32px 20px;
  font-size: 0.98rem;
}

.study-mode-bar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: clamp(12px, 2.8vw, 16px) clamp(14px, 3vw, 22px) 4px;
  background: rgba(34, 197, 94, 0.06);
  border-top: 1px solid rgba(34, 197, 94, 0.12);
  border-bottom: 1px solid var(--border);
}

.study-mode-bar label {
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: clamp(0.86rem, 2.8vw, 0.95rem);
  color: var(--muted);
  line-height: 1.4;
  user-select: none;
}

.study-mode-bar input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--success);
  cursor: pointer;
}

.study-mode-bar strong {
  color: #86efac;
  font-weight: 700;
}

.choices-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(10px, 2.4vw, 14px);
  padding: clamp(14px, 3vw, 22px);
  background: var(--surface);
}

@media (max-width: 600px) {
  .choices-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .image-wrap {
    min-height: unset;
  }
}

.choice-btn {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-weight: 700;
  font-size: clamp(1rem, 3.8vw, 1.25rem);
  letter-spacing: 0.06em;
  border-radius: 12px;
  padding: 16px 12px;
  min-height: 52px;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.choice-btn:hover {
  border-color: rgba(96, 165, 250, 0.45);
  background: rgba(59, 130, 246, 0.1);
}

.choice-btn:active {
  transform: scale(0.98);
}

.choice-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.choice-btn.is-correct-letter {
  border-color: rgba(74, 222, 128, 0.7);
  background: rgba(34, 197, 94, 0.22);
  color: #bbf7d0;
  box-shadow:
    inset 0 0 0 1px rgba(34, 197, 94, 0.25),
    0 10px 28px rgba(34, 197, 94, 0.12);
}

.choice-btn.is-correct-letter:hover {
  border-color: rgba(134, 239, 172, 0.85);
  background: rgba(34, 197, 94, 0.32);
  color: #dcfce7;
}

.choice-btn.is-correct-letter:focus-visible {
  outline-color: #4ade80;
}

.recap {
  padding: clamp(18px, 4vw, 28px);
}

.recap h1 {
  margin: 0 0 8px;
  font-size: clamp(1.35rem, 4.5vw, 1.75rem);
  font-weight: 700;
}

.recap-sub {
  margin: 0 0 22px;
  color: var(--muted);
  font-size: 0.98rem;
}

.recap-score-line {
  font-size: clamp(1.1rem, 3.5vw, 1.35rem);
  margin-bottom: 22px;
}

.recap-score-line .ok {
  color: var(--success);
  font-weight: 700;
}

.recap-score-line .ko {
  color: var(--danger);
  font-weight: 700;
}

.recap-section-title {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin: 0 0 10px;
}

.wrong-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 26px;
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 2px;
}

.tag {
  border: 1px solid var(--border);
  background: rgba(249, 115, 115, 0.12);
  color: var(--danger);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
}

.empty-wrong {
  color: var(--success);
  font-weight: 600;
  margin-bottom: 26px;
}

.primary-btn {
  appearance: none;
  border: none;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  padding: 14px 22px;
  border-radius: 12px;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 14px 32px rgba(37, 99, 235, 0.35);
  transition: transform 0.12s ease, filter 0.15s ease;
}

.primary-btn:hover {
  filter: brightness(1.05);
}

.primary-btn:active {
  transform: scale(0.99);
}

.primary-btn:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 3px;
}

@media (min-width: 520px) {
  .primary-btn {
    width: auto;
    min-width: 220px;
  }
}

.hint-corner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px 14px;
  padding: clamp(10px, 2.5vw, 14px) clamp(14px, 3vw, 22px)
    clamp(16px, 3vw, 22px);
  border-top: 1px solid var(--border);
  background: rgba(12, 15, 20, 0.55);
}

.hint-toggle {
  appearance: none;
  cursor: pointer;
  border: 1px solid rgba(251, 191, 36, 0.45);
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  font-weight: 600;
  font-size: clamp(0.82rem, 2.8vw, 0.93rem);
  padding: 10px 14px;
  border-radius: 999px;
  transition:
    filter 0.15s ease,
    transform 0.12s ease,
    background 0.15s ease;
}

.hint-toggle:hover {
  filter: brightness(1.08);
  background: rgba(251, 191, 36, 0.16);
}

.hint-toggle:active {
  transform: scale(0.98);
}

.hint-toggle:focus-visible {
  outline: 2px solid #fcd34d;
  outline-offset: 2px;
}

.hint-answer-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hint-badge {
  font-size: clamp(1.05rem, 4vw, 1.35rem);
  font-weight: 800;
  letter-spacing: 0.14em;
  background: rgba(34, 197, 94, 0.16);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.45);
  border-radius: 10px;
  padding: 8px 16px;
  min-width: 3.25rem;
  text-align: center;
}

.hint-micro {
  font-size: clamp(0.72rem, 2.5vw, 0.8rem);
  color: var(--muted);
  text-align: right;
  flex: 1 1 140px;
  max-width: 100%;
}

@media (max-width: 480px) {
  .hint-corner {
    justify-content: space-between;
  }

  .hint-micro {
    flex-basis: 100%;
    order: -1;
    text-align: left;
  }
}
`;

function scoreForSelections(
  correct: Record<number, AnswerLetter>,
  picks: Partial<Record<number, AnswerLetter>>,
  total: number
): number {
  let s = 0;
  for (let n = 1; n <= total; n++) {
    const p = picks[n];
    if (p && p === correct[n]) s++;
  }
  return s;
}

export default function App() {
  const totalQuestions = useMemo(
    () => inferTotalQuestions(correctRaw as AnswersFile),
    []
  );

  const correct = useMemo(
    () =>
      normalizeCorrect(correctRaw as AnswersFile, totalQuestions),
    [totalQuestions]
  );

  const [phase, setPhase] = useState<"quiz" | "recap">("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<
    Partial<Record<number, AnswerLetter>>
  >({});
  const [imgError, setImgError] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [greenCorrectLetters, setGreenCorrectLetters] = useState(true);

  useEffect(() => {
    setGreenCorrectLetters(readGreenCorrectPreference());
  }, []);

  const questionNum = currentIndex + 1;
  const answeredCount = Object.keys(selections).length;
  const currentScore = useMemo(
    () => scoreForSelections(correct, selections, totalQuestions),
    [correct, selections, totalQuestions]
  );

  useEffect(() => {
    setHintVisible(false);
  }, [questionNum]);

  const wrongNumbers = useMemo(() => {
    const w: number[] = [];
    for (let n = 1; n <= totalQuestions; n++) {
      const p = selections[n];
      if (p && p !== correct[n]) w.push(n);
    }
    return w;
  }, [correct, selections, totalQuestions]);

  const pick = useCallback(
    (letter: AnswerLetter) => {
      const num = questionNum;
      setSelections((prev) => ({ ...prev, [num]: letter }));

      if (currentIndex >= totalQuestions - 1) {
        setPhase("recap");
        return;
      }
      setCurrentIndex((i) => i + 1);
      setImgError(false);
    },
    [currentIndex, questionNum, totalQuestions]
  );

  const restart = useCallback(() => {
    setPhase("quiz");
    setCurrentIndex(0);
    setSelections({});
    setImgError(false);
    setHintVisible(false);
  }, []);

  const setLearningGreen = useCallback((enabled: boolean) => {
    setGreenCorrectLetters(enabled);
    try {
      window.localStorage.setItem(
        GREEN_CORRECT_STORAGE,
        enabled ? "1" : "0"
      );
    } catch {
      /* ignore */
    }
  }, []);

  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <>
      <style>{css}</style>
      <div className="quiz-shell">
        <div className="quiz-card">
          {phase === "quiz" ? (
            <>
              <div className="quiz-progress-row">
                <span className="quiz-progress-label">
                  Question {questionNum}/{totalQuestions}
                </span>
                <span className="quiz-score-chip">
                  Bonnes réponses : <strong>{currentScore}</strong> /{" "}
                  {answeredCount}
                  {answeredCount === 0
                    ? " — choisissez A, B, C ou D"
                    : answeredCount === 1
                      ? " réponse"
                      : " réponses"}
                </span>
              </div>
              <div className="progress-track" aria-hidden>
                <div
                  className="progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="image-wrap">
                {!imgError ? (
                  <img
                    className="quiz-img"
                    src={`/qcm/${questionNum}.jpg`}
                    alt={`Question ${questionNum}`}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <p className="image-fallback">
                    Image introuvable : vérifiez que{" "}
                    <code>/public/qcm/{questionNum}.jpg</code> existe.
                  </p>
                )}
              </div>
              <div className="study-mode-bar">
                <label htmlFor="qcm-learning-green">
                  <input
                    id="qcm-learning-green"
                    type="checkbox"
                    checked={greenCorrectLetters}
                    onChange={(e) => setLearningGreen(e.target.checked)}
                  />
                  <span>
                    <strong>Bonne réponse en vert</strong> sur le bouton
                    correspondant pour mémoriser. Décoche quand tu veux t’examiner
                    sans indice visible.
                  </span>
                </label>
              </div>
              <div className="choices-grid" role="group" aria-label="Réponses">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`choice-btn${
                      greenCorrectLetters && opt === correct[questionNum]
                        ? " is-correct-letter"
                        : ""
                    }`}
                    onClick={() => pick(opt)}
                    aria-label={`Répondre ${opt}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="hint-corner">
                {!hintVisible && (
                  <p className="hint-micro">
                    Coin aide : montrez la bonne lettre si vous êtes bloqué —
                    mieux sans regarder !
                  </p>
                )}
                <button
                  type="button"
                  className="hint-toggle"
                  onClick={() => setHintVisible((v) => !v)}
                  aria-expanded={hintVisible}
                  aria-controls="quiz-hint-answer"
                  id="quiz-hint-toggle"
                >
                  {hintVisible ? "Masquer la bonne réponse" : "Afficher la bonne réponse"}
                </button>
                {hintVisible && (
                  <div className="hint-answer-box" id="quiz-hint-answer">
                    <span className="hint-micro">
                      Lettres à sélectionner : A, B, C ou D
                    </span>
                    <span className="hint-badge">{correct[questionNum]}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="recap">
              <h1>Quiz terminé</h1>
              <p className="recap-sub">
                Vous avez complété les {totalQuestions} questions.
              </p>
              <p className="recap-score-line">
                Score final :{" "}
                <span className="ok">{currentScore}</span> /{" "}
                {totalQuestions}{" "}
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                  (
                  {Math.round((currentScore / totalQuestions) * 100)}
                  %)
                </span>
              </p>
              <p className="recap-section-title">Questions incorrectes</p>
              {wrongNumbers.length === 0 ? (
                <p className="empty-wrong">Aucune erreur — parfait !</p>
              ) : (
                <div className="wrong-tags" role="list">
                  {wrongNumbers.map((n) => (
                    <span key={n} className="tag" role="listitem">
                      Q{n} (vous : {selections[n] ?? "?"} · bonne :{" "}
                      {correct[n]})
                    </span>
                  ))}
                </div>
              )}
              <button type="button" className="primary-btn" onClick={restart}>
                Recommencer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
