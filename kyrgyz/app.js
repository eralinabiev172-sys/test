const quizKind = document.body?.dataset?.quizKind || "language";
const levelStorageKey = `kyrgyz-${quizKind}-level`;

const quizTitles = {
  language: "Кыргыз тили",
  literature: "Кыргыз адабияты"
};

const quizTitle = quizTitles[quizKind] || "Кыргыз тили";

const state = {
  started: false,
  showingResults: false,
  currentIndex: 0,
  randomMode: true,
  level: document.body?.dataset?.quizLevel || localStorage.getItem(levelStorageKey) || "B1",
  questions: [],
  answers: {},
  limit: null,
  timeLimit: 25,
  timeLeft: 25,
  timerId: null,
  timerPaused: false,
  restoreTimer: false,
  sessionNoteKey: "sessionNote"
};

const ui = {
  levelButtons: document.querySelectorAll("[data-level]"),
  quizHeading: document.getElementById("quizHeading"),
  randomToggleBtn: document.getElementById("randomToggleBtn"),
  startBtn: document.getElementById("startBtn"),
  finishBtn: document.getElementById("finishBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  newVariantBtn: document.getElementById("newVariantBtn"),
  questionLimit: document.getElementById("questionLimit"),
  questionTimeLimit: document.getElementById("questionTimeLimit"),
  jumpInput: document.getElementById("jumpToQuestion"),
  jumpBtn: document.getElementById("jumpBtn"),
  jumpLabel: document.getElementById("jumpLabel"),
  sessionNote: document.getElementById("sessionNote"),
  timeLimitLabel: document.getElementById("timeLimitLabel"),
  statusBanner: document.getElementById("statusBanner"),
  heroQuestionCount: document.getElementById("heroQuestionCount"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
  answeredCount: document.getElementById("answeredCount"),
  remainingCount: document.getElementById("remainingCount"),
  questionMapTitle: document.getElementById("questionMapTitle"),
  questionMapHint: document.getElementById("questionMapHint"),
  questionMap: document.getElementById("questionMap"),
  quizCard: document.getElementById("quizCard"),
  resultCard: document.getElementById("resultCard"),
  questionCounter: document.getElementById("questionCounter"),
  questionNumberBadge: document.getElementById("questionNumberBadge"),
  questionTimerBadge: document.getElementById("questionTimerBadge"),
  questionTitle: document.getElementById("questionTitle"),
  optionsList: document.getElementById("optionsList"),
  inlinePrevBtn: document.getElementById("inlinePrevBtn"),
  inlineNextBtn: document.getElementById("inlineNextBtn"),
  resultTitle: document.getElementById("resultTitle"),
  resultScore: document.getElementById("resultScore"),
  resultSummary: document.getElementById("resultSummary"),
  resultBody: document.getElementById("resultBody")
};

const letters = ["А", "Б", "В", "Г", "Д"];
const text = {
  statusIdle: "«Тестти баштоо» баскычын басып, аралаштырылган жаңы вариантты ач.",
  statusQuestion: "Бир жоопту танда же навигатордон керектүү номерге өт.",
  statusResult: "Төмөндө сенин жоопторуң, туура варианттар жана жалпы жыйынтык көрсөтүлдү.",
  noAnswer: "Жооп жок",
  noKey: "Туура жооптун ачкычы жок",
  resultTitle: "Сенин жоопторуң",
  sessionNote: "Прогресс ушул түзмөктө сакталат.",
  sessionRestored: "Мурунку прогресс калыбына келтирилди.",
  timeExpired: "Убакыт бүттү, тестти жыйынтыктайбыз.",
  pauseLabel: "Токтотуу",
  resumeLabel: "Улантуу",
  timePaused: "Токтотулду"
};

function getAvailableLevels() {
  const source = window.kyrgyzTests?.[quizKind];
  return source ? Object.keys(source) : [];
}

function normalizeLevel() {
  const levels = getAvailableLevels();
  if (levels.includes(state.level)) {
    return;
  }
  state.level = levels[0] || "B1";
}

function getSourceQuestions(level = state.level) {
  const source = window.kyrgyzTests?.[quizKind]?.[level];
  return Array.isArray(source) ? source : [];
}

function getQuestions() {
  return state.questions.length ? state.questions : getSourceQuestions();
}

function getProgressStorageKey(level = state.level) {
  return `quiz-progress:${location.pathname}:${quizKind}:${level}`;
}

function getQuestionKey(question, index) {
  return String(question.number || index + 1);
}

function getOrderedQuestions(items) {
  return [...items].sort((first, second) => (first.number || 0) - (second.number || 0));
}

function getRandomQuestions(items, limit) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, limit);
}

function getSelectedLimit() {
  const sourceQuestions = getSourceQuestions();
  if (!ui.questionLimit) {
    return sourceQuestions.length;
  }

  const limit = Number(ui.questionLimit.value);
  if (!Number.isFinite(limit) || limit <= 0) {
    return sourceQuestions.length;
  }

  return Math.min(limit, sourceQuestions.length);
}

function getSelectedTimeLimit() {
  if (!ui.questionTimeLimit) {
    return 25;
  }

  const limit = Number(ui.questionTimeLimit.value);
  if (!Number.isFinite(limit) || limit <= 0) {
    return 25;
  }

  return limit;
}

function prepareVariant() {
  const sourceQuestions = getSourceQuestions();
  state.limit = getSelectedLimit();
  if (!sourceQuestions.length) {
    state.questions = [];
    return;
  }

  if (!state.randomMode || state.limit >= sourceQuestions.length) {
    state.questions = getOrderedQuestions(sourceQuestions).slice(0, state.limit);
    return;
  }

  state.questions = getOrderedQuestions(getRandomQuestions(sourceQuestions, state.limit));
}

function hasAnswerKey(question) {
  return Number.isInteger(question.correctIndex)
    && question.correctIndex >= 0
    && Array.isArray(question.options)
    && question.correctIndex < question.options.length;
}

function getAnsweredCount() {
  return Object.keys(state.answers).length;
}

function optionLetter(index) {
  return letters[index] || String(index + 1);
}

function getRandomToggleLabel() {
  return state.randomMode ? "Тартип: аралаш" : "Тартип: ирети менен";
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setBanner(message) {
  if (ui.statusBanner) {
    ui.statusBanner.textContent = message;
  }
}

function renderSessionNote() {
  if (ui.sessionNote) {
    ui.sessionNote.textContent = text[state.sessionNoteKey] || text.sessionNote;
  }
}

function stopQuestionTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updatePauseButton() {
  if (!ui.pauseBtn) {
    return;
  }

  if (!state.started || state.showingResults || !state.questions.length) {
    ui.pauseBtn.disabled = true;
    ui.pauseBtn.textContent = text.pauseLabel;
    ui.pauseBtn.classList.remove("secondary-btn--active");
    return;
  }

  ui.pauseBtn.disabled = false;
  ui.pauseBtn.textContent = state.timerPaused ? text.resumeLabel : text.pauseLabel;
  ui.pauseBtn.classList.toggle("secondary-btn--active", state.timerPaused);
}

function updateTimerBadge() {
  if (!ui.questionTimerBadge) {
    return;
  }

  if (!state.started || state.showingResults || !state.questions.length) {
    ui.questionTimerBadge.textContent = "";
    ui.questionTimerBadge.classList.remove("question-badge--warning");
    return;
  }

  if (state.timerPaused) {
    ui.questionTimerBadge.textContent = `Токтотулду: ${state.timeLeft} сек`;
    ui.questionTimerBadge.classList.remove("question-badge--warning");
    return;
  }

  ui.questionTimerBadge.textContent = `Калды: ${state.timeLeft} сек`;
  ui.questionTimerBadge.classList.toggle("question-badge--warning", state.timeLeft <= 5);
}

function handleTimerExpired() {
  if (!state.started || state.showingResults || !state.questions.length) {
    return;
  }

  setBanner(text.timeExpired);
  showResults();
}

function startQuestionTimer(resetTime = true) {
  stopQuestionTimer();
  if (!state.started || state.showingResults || !state.questions.length) {
    updateTimerBadge();
    updatePauseButton();
    return;
  }

  state.timeLimit = getSelectedTimeLimit();
  if (resetTime || !Number.isFinite(state.timeLeft) || state.timeLeft <= 0 || state.timeLeft > state.timeLimit) {
    state.timeLeft = state.timeLimit;
  }
  updateTimerBadge();
  updatePauseButton();
  if (state.timerPaused) {
    return;
  }

  state.timerId = window.setInterval(() => {
    if (!state.started || state.showingResults) {
      stopQuestionTimer();
      return;
    }

    if (state.timerPaused) {
      stopQuestionTimer();
      return;
    }

    state.timeLeft -= 1;
    saveProgress();
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      updateTimerBadge();
      stopQuestionTimer();
      handleTimerExpired();
      return;
    }

    updateTimerBadge();
  }, 1000);
}

function clearSavedProgress(level = state.level) {
  try {
    window.localStorage.removeItem(getProgressStorageKey(level));
  } catch {
    // Continue without persistence if storage is unavailable.
  }
}

function saveProgress() {
  const sourceQuestions = getSourceQuestions();
  const hasUsefulState = state.questions.length > 0
    && (state.started || state.showingResults || getAnsweredCount() > 0);
  if (!hasUsefulState) {
    clearSavedProgress();
    return;
  }

  try {
    window.localStorage.setItem(getProgressStorageKey(), JSON.stringify({
      started: state.started,
      currentIndex: state.currentIndex,
      answers: state.answers,
      limit: state.limit,
      timeLeft: state.timeLeft,
      timerPaused: state.timerPaused,
      randomMode: state.randomMode,
      showingResults: state.showingResults,
      questions: state.questions,
      sourceTotal: sourceQuestions.length
    }));
  } catch {
    // Keep the quiz usable even when localStorage fails.
  }
}

function restoreProgress() {
  try {
    const raw = window.localStorage.getItem(getProgressStorageKey());
    if (!raw) {
      return false;
    }

    const saved = JSON.parse(raw);
    const sourceQuestions = getSourceQuestions();
    if (!saved || !Array.isArray(saved.questions) || saved.questions.length === 0) {
      return false;
    }

    if (saved.sourceTotal !== sourceQuestions.length) {
      return false;
    }

    state.questions = getOrderedQuestions(saved.questions).slice(0, saved.questions.length);
    state.started = Boolean(saved.started);
    state.answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
    state.limit = Number.isFinite(saved.limit) ? saved.limit : saved.questions.length;
    state.timeLeft = Number.isFinite(saved.timeLeft) && saved.timeLeft > 0
      ? saved.timeLeft
      : getSelectedTimeLimit();
    state.timerPaused = Boolean(saved.timerPaused);
    state.randomMode = saved.randomMode !== false;
    state.currentIndex = Number.isInteger(saved.currentIndex)
      ? Math.min(Math.max(saved.currentIndex, 0), saved.questions.length - 1)
      : 0;
    state.showingResults = Boolean(saved.showingResults);
    state.restoreTimer = !state.showingResults && Boolean(saved.started);
    state.sessionNoteKey = "sessionRestored";
    if (ui.questionLimit) {
      ui.questionLimit.value = String(state.limit);
    }
    renderSessionNote();
    return true;
  } catch {
    return false;
  }
}

function canReturnToPreviousQuestion() {
  return state.started && state.showingResults && state.currentIndex > 0;
}

function hasCurrentQuestionAnswer() {
  if (!state.started || !state.questions.length) {
    return false;
  }

  const currentQuestion = state.questions[state.currentIndex];
  return state.answers[getQuestionKey(currentQuestion, state.currentIndex)] !== undefined;
}

function canOpenQuestionAtIndex(index) {
  if (!state.started) {
    return false;
  }

  if (index < 0 || index >= state.questions.length) {
    return false;
  }

  if (state.showingResults) {
    return true;
  }

  if (index > state.currentIndex && !hasCurrentQuestionAnswer()) {
    return false;
  }

  return index >= state.currentIndex;
}

function updateControls() {
  const sourceQuestions = getSourceQuestions();
  const atEnd = state.currentIndex === state.questions.length - 1;
  const prevDisabled = !canReturnToPreviousQuestion();
  const nextDisabled = !state.started || atEnd || !hasCurrentQuestionAnswer();

  if (ui.quizHeading) {
    ui.quizHeading.textContent = `${quizTitle} — ${state.level}`;
  }
  document.title = `${quizTitle} — ${state.level}`;

  if (ui.randomToggleBtn) {
    ui.randomToggleBtn.textContent = getRandomToggleLabel();
  }
  if (ui.heroQuestionCount) {
    ui.heroQuestionCount.textContent = String(sourceQuestions.length);
  }
  if (ui.questionMapTitle) {
    ui.questionMapTitle.textContent = "Суроолор картасы";
  }
  if (ui.questionMapHint) {
    ui.questionMapHint.textContent = sourceQuestions.length
      ? "Тез өтүү үчүн номерди бас"
      : `${state.level} үчүн суроолор азырынча жүктөлгөн жок.`;
  }
  if (ui.startBtn) {
    ui.startBtn.textContent = "Тестти баштоо";
  }
  if (ui.finishBtn) {
    ui.finishBtn.textContent = "Аяктоо";
    ui.finishBtn.disabled = !state.started;
  }
  if (ui.pauseBtn) {
    ui.pauseBtn.textContent = state.timerPaused ? text.resumeLabel : text.pauseLabel;
    ui.pauseBtn.disabled = !state.started || state.showingResults || !state.questions.length;
  }
  if (ui.resetBtn) {
    ui.resetBtn.textContent = "Тазалоо";
    ui.resetBtn.disabled = !state.started && getAnsweredCount() === 0;
  }
  if (ui.newVariantBtn) {
    ui.newVariantBtn.textContent = "Жаңы вариант";
    ui.newVariantBtn.disabled = sourceQuestions.length === 0;
  }
  if (ui.inlinePrevBtn) {
    ui.inlinePrevBtn.textContent = "Артка";
    ui.inlinePrevBtn.disabled = prevDisabled;
  }
  if (ui.inlineNextBtn) {
    ui.inlineNextBtn.textContent = "Кийинки";
    ui.inlineNextBtn.disabled = nextDisabled;
  }
  if (ui.questionLimit) {
    ui.questionLimit.disabled = state.started;
  }
  if (ui.questionTimeLimit) {
    ui.questionTimeLimit.disabled = state.started;
  }
  if (ui.jumpLabel) {
    ui.jumpLabel.textContent = "Суроого өтүү";
  }
  if (ui.jumpBtn) {
    ui.jumpBtn.textContent = "Ачуу";
    ui.jumpBtn.disabled = state.questions.length === 0;
  }
  if (ui.jumpInput) {
    ui.jumpInput.placeholder = "№";
    ui.jumpInput.disabled = state.questions.length === 0;
  }
  if (ui.timeLimitLabel) {
    ui.timeLimitLabel.textContent = "Суроого убакыт";
  }

  ui.levelButtons.forEach((button) => {
    const active = button.dataset.level === state.level;
    button.classList.toggle("chip--active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  updateTimerBadge();
  updatePauseButton();
  renderSessionNote();
}

function renderQuestionMap() {
  if (!ui.questionMap) {
    return;
  }

  const questions = getQuestions();
  ui.questionMap.innerHTML = "";
  questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-button";
    button.textContent = String(question.number || index + 1);
    button.classList.toggle("map-button--current", index === state.currentIndex && state.started);
    button.classList.toggle("map-button--answered", state.answers[getQuestionKey(question, index)] !== undefined);
    button.disabled = state.started && !canOpenQuestionAtIndex(index);

    button.addEventListener("click", () => {
      if (!state.started) {
        startQuiz();
      }
      if (!canOpenQuestionAtIndex(index)) {
        return;
      }
      state.currentIndex = index;
      renderQuestion();
      scrollIntoViewIfNeeded();
    });

    ui.questionMap.appendChild(button);
  });
}

function renderProgress() {
  const total = getQuestions().length;
  const answered = getAnsweredCount();
  const remaining = Math.max(total - answered, 0);
  const percent = total ? Math.round((answered / total) * 100) : 0;

  if (ui.progressText) {
    ui.progressText.textContent = `${total} суроонун ${answered} суроосуна жооп берилди`;
  }
  if (ui.progressBar) {
    ui.progressBar.style.width = `${percent}%`;
  }
  if (ui.answeredCount) {
    ui.answeredCount.textContent = `${answered} жооп берилди`;
  }
  if (ui.remainingCount) {
    ui.remainingCount.textContent = `${remaining} калды`;
  }

  renderQuestionMap();
  updateControls();
}

function scrollIntoViewIfNeeded() {
  const target = state.showingResults ? ui.resultCard : ui.quizCard;
  if (!target || target.classList.contains("hidden")) {
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  if (!question) {
    if (ui.questionCounter) ui.questionCounter.textContent = "";
    if (ui.questionNumberBadge) ui.questionNumberBadge.textContent = "";
    if (ui.questionTitle) ui.questionTitle.textContent = "";
    if (ui.optionsList) ui.optionsList.innerHTML = "";
    renderProgress();
    return;
  }

  const key = getQuestionKey(question, state.currentIndex);
  const resetTimer = !state.restoreTimer;
  state.restoreTimer = false;
  ui.quizCard.classList.remove("hidden");
  ui.resultCard.classList.add("hidden");
  state.showingResults = false;
  ui.questionCounter.textContent = `${state.currentIndex + 1} / ${state.questions.length}`;
  ui.questionNumberBadge.textContent = `Суроо №${question.number || state.currentIndex + 1}`;
  ui.questionTitle.textContent = question.text;
  ui.optionsList.innerHTML = "";

  question.options.forEach((option, index) => {
    const optionWrap = document.createElement("div");
    optionWrap.className = "option-item";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = `question-${question.number || state.currentIndex}`;
    input.id = `question-${question.number || state.currentIndex}-option-${index}`;
    input.className = "option-input";
    input.checked = state.answers[key] === index;
    input.addEventListener("change", () => {
      state.answers[key] = index;
      renderProgress();
      saveProgress();
    });

    const label = document.createElement("label");
    label.className = "option-label";
    label.setAttribute("for", input.id);
    label.setAttribute("data-letter", optionLetter(index));
    label.textContent = option;

    optionWrap.appendChild(input);
    optionWrap.appendChild(label);
    ui.optionsList.appendChild(optionWrap);
  });

  setBanner(text.statusQuestion);
  renderProgress();
  startQuestionTimer(resetTimer);
  saveProgress();
}

function startQuiz() {
  prepareVariant();
  if (!state.questions.length) {
    setBanner(`${state.level} үчүн суроолор азырынча жүктөлгөн жок.`);
    renderProgress();
    return;
  }

  state.started = true;
  state.showingResults = false;
  state.currentIndex = 0;
  state.answers = {};
  state.timeLeft = getSelectedTimeLimit();
  state.sessionNoteKey = "sessionNote";
  state.timerPaused = false;
  state.restoreTimer = false;
  stopQuestionTimer();
  updatePauseButton();
  renderSessionNote();
  renderQuestion();
}

function goToPreviousQuestion() {
  if (!canReturnToPreviousQuestion()) {
    return;
  }

  state.currentIndex -= 1;
  renderQuestion();
  scrollIntoViewIfNeeded();
}

function goToNextQuestion() {
  if (!state.started || state.currentIndex >= state.questions.length - 1 || !hasCurrentQuestionAnswer()) {
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
  scrollIntoViewIfNeeded();
}

function goToQuestionNumber(rawValue) {
  const questionNumber = Number(rawValue);
  if (!Number.isInteger(questionNumber) || questionNumber <= 0) {
    return;
  }

  if (!state.started) {
    startQuiz();
  }

  const questionIndex = state.questions.findIndex((question, index) => Number(question.number || index + 1) === questionNumber);
  if (questionIndex === -1) {
    setBanner(`№${questionNumber} суроо ушул вариантка кирбей калды.`);
    return;
  }

  if (!canOpenQuestionAtIndex(questionIndex)) {
    return;
  }

  state.currentIndex = questionIndex;
  renderQuestion();
  scrollIntoViewIfNeeded();
}

function answerCurrentQuestion(index) {
  if (!state.started || !state.questions.length) {
    return;
  }

  const question = state.questions[state.currentIndex];
  if (index < 0 || index >= question.options.length) {
    return;
  }

  state.answers[getQuestionKey(question, state.currentIndex)] = index;
  renderQuestion();
}

function countResults() {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let ungraded = 0;

  state.questions.forEach((question, index) => {
    if (!hasAnswerKey(question)) {
      ungraded += 1;
      return;
    }

    const answer = state.answers[getQuestionKey(question, index)];
    if (answer === undefined) {
      unanswered += 1;
      return;
    }

    if (answer === question.correctIndex) {
      correct += 1;
    } else {
      wrong += 1;
    }
  });

  return { correct, wrong, unanswered, ungraded };
}

function showResults() {
  if (!state.started || !state.questions.length) {
    return;
  }

  stopQuestionTimer();
  state.timerPaused = false;
  state.showingResults = true;
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.remove("hidden");
  ui.resultTitle.textContent = text.resultTitle;
  ui.resultBody.innerHTML = "";

  state.questions.forEach((question, index) => {
    const answer = state.answers[getQuestionKey(question, index)];
    const isAnswered = answer !== undefined;
    const isCorrect = isAnswered && hasAnswerKey(question) && answer === question.correctIndex;
    const selectedText = !isAnswered
      ? text.noAnswer
      : `${optionLetter(answer)} · ${question.options[answer] || ""}`;
    const correctText = hasAnswerKey(question)
      ? `${optionLetter(question.correctIndex)} · ${question.options[question.correctIndex] || ""}`
      : text.noKey;

    const row = document.createElement("tr");
    row.className = !hasAnswerKey(question)
      ? "result-row result-row--ungraded"
      : !isAnswered
        ? "result-row result-row--skipped"
        : isCorrect
          ? "result-row result-row--correct"
          : "result-row result-row--wrong";
    row.innerHTML = `
      <td>${question.number || index + 1}</td>
      <td>${escapeHtml(question.text)}</td>
      <td>${escapeHtml(selectedText)}</td>
      <td>${escapeHtml(correctText)}</td>
    `;
    ui.resultBody.appendChild(row);
  });

  const answered = getAnsweredCount();
  const { correct, wrong, unanswered, ungraded } = countResults();
  const gradable = state.questions.length - ungraded;
  const percent = gradable ? Math.round((correct / gradable) * 100) : 0;
  ui.resultScore.textContent = gradable
    ? `${correct} / ${gradable} туура · ${percent}%`
    : `${state.questions.length} суроонун туура жооп ачкычы берилген эмес`;
  ui.resultSummary.textContent = `Жооп берилгени: ${answered} / ${state.questions.length}. Ачкычы бар суроолор: ${gradable}. Туурасы: ${correct}. Туура эмеси: ${wrong}. Жоопсуз: ${unanswered}. Ачкычы жок: ${ungraded}.`;
  setBanner(text.statusResult);
  renderProgress();
  updatePauseButton();
  saveProgress();
  scrollIntoViewIfNeeded();
}

function resetQuiz() {
  stopQuestionTimer();
  prepareVariant();
  state.started = false;
  state.currentIndex = 0;
  state.answers = {};
  state.showingResults = false;
  state.timerPaused = false;
  state.restoreTimer = false;
  state.timeLeft = getSelectedTimeLimit();
  state.sessionNoteKey = "sessionNote";
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.add("hidden");
  setBanner(text.statusIdle);
  renderSessionNote();
  renderProgress();
  updatePauseButton();
  clearSavedProgress();
}

function togglePauseTimer() {
  if (!state.started || state.showingResults || !state.questions.length) {
    return;
  }

  state.timerPaused = !state.timerPaused;
  stopQuestionTimer();
  updateTimerBadge();
  updatePauseButton();
  saveProgress();

  if (!state.timerPaused) {
    startQuestionTimer(false);
  }
}

function setLevel(level) {
  const availableLevels = getAvailableLevels();
  if (!availableLevels.includes(level)) {
    return;
  }

  stopQuestionTimer();
  state.level = level;
  localStorage.setItem(levelStorageKey, level);
  state.currentIndex = 0;
  state.answers = {};
  state.questions = [];
  state.showingResults = false;
  if (!restoreProgress()) {
    resetQuiz();
  } else if (state.showingResults) {
    showResults();
  } else if (state.started) {
    renderQuestion();
  } else {
    renderProgress();
  }
}

ui.startBtn?.addEventListener("click", startQuiz);
ui.finishBtn?.addEventListener("click", showResults);
ui.pauseBtn?.addEventListener("click", togglePauseTimer);
ui.resetBtn?.addEventListener("click", resetQuiz);
ui.newVariantBtn?.addEventListener("click", startQuiz);
ui.inlinePrevBtn?.addEventListener("click", goToPreviousQuestion);
ui.inlineNextBtn?.addEventListener("click", goToNextQuestion);
ui.jumpBtn?.addEventListener("click", () => {
  goToQuestionNumber(ui.jumpInput?.value);
});
ui.jumpInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    goToQuestionNumber(ui.jumpInput.value);
  }
});
ui.randomToggleBtn?.addEventListener("click", () => {
  state.randomMode = !state.randomMode;
  updateControls();
  if (state.started || getAnsweredCount() > 0 || state.questions.length > 0) {
    resetQuiz();
  } else {
    saveProgress();
  }
});
ui.questionLimit?.addEventListener("change", () => {
  if (!state.started) {
    resetQuiz();
  }
});
ui.questionTimeLimit?.addEventListener("change", () => {
  if (!state.started) {
    resetQuiz();
  }
});
ui.levelButtons.forEach((button) => {
  button.addEventListener("click", () => setLevel(button.dataset.level));
});

document.addEventListener("keydown", (event) => {
  const tagName = event.target?.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return;
  }

  if (!state.started || state.showingResults) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToPreviousQuestion();
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    goToNextQuestion();
    return;
  }

  if (/^[1-5]$/.test(event.key)) {
    event.preventDefault();
    answerCurrentQuestion(Number(event.key) - 1);
  }
});

normalizeLevel();
updateControls();
if (restoreProgress()) {
  if (state.showingResults) {
    showResults();
  } else if (state.started) {
    renderQuestion();
  } else {
    renderProgress();
  }
} else {
  resetQuiz();
}
