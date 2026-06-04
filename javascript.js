const sourceQuestions = Array.isArray(window.questionsData) ? window.questionsData : [];
let questions = [];

const translations = {
  ru: {
    questionPrefix: "Вопрос №",
    answeredText: "отвечено",
    remainingText: "осталось",
    progressText: (answered, total) => `${answered} из ${total} отвечено`,
    statusIdle: "Нажми «Начать тест», чтобы открыть новый вариант с перемешанными вопросами.",
    statusQuestion: "Выбери один вариант ответа или перейди к нужному номеру через навигатор.",
    statusResult: "Ниже показаны твои ответы, правильные варианты и общий результат.",
    noAnswer: "Нет ответа",
    noKey: "Нет ключа ответа",
    resultTitle: "Твои ответы",
    resultSummary: (answered, total, gradable, correct, wrong, unanswered, ungraded) =>
      `Отвечено: ${answered} из ${total}. С ключом: ${gradable}. Правильно: ${correct}. Неправильно: ${wrong}. Без ответа: ${unanswered}. Без ключа: ${ungraded}.`,
    resultScore: (correct, total, percent) => `${correct} из ${total} верно · ${percent}%`,
    resultScoreNoKey: (total) => `Для ${total} вопросов ключи ответа не заданы`,
    mapTitle: "Карта вопросов",
    mapHint: "Нажми на номер, чтобы быстро перейти",
    startLabel: "Начать тест",
    finishLabel: "Завершить",
    resetLabel: "Сбросить",
    newVariantLabel: "Новый вариант",
    jumpLabel: "Перейти к вопросу",
    jumpButtonLabel: "Открыть",
    jumpPlaceholder: "№",
    jumpMissing: (number) => `Вопрос №${number} не вошел в текущий вариант.`,
    timeLimitLabel: "Время на вопрос",
    timeLeftLabel: "Осталось",
    timeExpired: "Время вышло, переходим к следующему вопросу.",
    timeValue: (seconds) => `${seconds} сек`,
    sessionNote: "Прогресс сохраняется на этом устройстве.",
    sessionRestored: "Прошлый прогресс восстановлен."
  },
  kg: {
    questionPrefix: "Суроо №",
    answeredText: "жооп берилди",
    remainingText: "калды",
    progressText: (answered, total) => `${total} суроонун ${answered} суроосуна жооп берилди`,
    statusIdle: "«Тестти баштоо» баскычын басып, аралаштырылган жаңы вариантты ач.",
    statusQuestion: "Бир жоопту танда же навигатордон керектүү номерге өт.",
    statusResult: "Төмөндө сенин жоопторуң, туура варианттар жана жыйынтык көрсөтүлдү.",
    noAnswer: "Жооп жок",
    noKey: "Туура жооптун ачкычы жок",
    resultTitle: "Сенин жоопторуң",
    resultSummary: (answered, total, gradable, correct, wrong, unanswered, ungraded) =>
      `Жооп берилгени: ${answered} / ${total}. Ачкычы бар суроолор: ${gradable}. Туурасы: ${correct}. Туура эмеси: ${wrong}. Жоопсуз: ${unanswered}. Ачкычы жок: ${ungraded}.`,
    resultScore: (correct, total, percent) => `${correct} / ${total} туура · ${percent}%`,
    resultScoreNoKey: (total) => `${total} суроонун туура жооп ачкычы берилген эмес`,
    mapTitle: "Суроолор картасы",
    mapHint: "Тез өтүү үчүн номерди бас",
    startLabel: "Тестти баштоо",
    finishLabel: "Аяктоо",
    resetLabel: "Тазалоо",
    newVariantLabel: "Жаңы вариант",
    jumpLabel: "Суроого өтүү",
    jumpButtonLabel: "Ачуу",
    jumpPlaceholder: "№",
    jumpMissing: (number) => `№${number} суроо ушул вариантка кирбей калды.`,
    timeLimitLabel: "Суроого убакыт",
    timeLeftLabel: "Калды",
    timeExpired: "Убакыт бүттү, кийинки суроого өтөбүз.",
    timeValue: (seconds) => `${seconds} сек`,
    sessionNote: "Прогресс ушул түзмөктө сакталат.",
    sessionRestored: "Мурунку прогресс калыбына келтирилди."
  }
};

const state = {
  lang: "ru",
  started: false,
  currentIndex: 0,
  answers: {},
  limit: null,
  timeLimit: 25,
  timeLeft: 25,
  timerId: null,
  randomMode: true,
  showingResults: false,
  sessionNoteKey: "sessionNote"
};

const ui = {
  langRu: document.getElementById("langRu"),
  langKg: document.getElementById("langKg"),
  startBtn: document.getElementById("startBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  inlinePrevBtn: document.getElementById("inlinePrevBtn"),
  inlineNextBtn: document.getElementById("inlineNextBtn"),
  finishBtn: document.getElementById("finishBtn"),
  resetBtn: document.getElementById("resetBtn"),
  newVariantBtn: document.getElementById("newVariantBtn"),
  questionLimit: document.getElementById("questionLimit"),
  questionTimeLimit: document.getElementById("questionTimeLimit"),
  randomToggleBtn: document.getElementById("randomToggleBtn"),
  jumpInput: document.getElementById("jumpToQuestion"),
  jumpBtn: document.getElementById("jumpBtn"),
  jumpLabel: document.getElementById("jumpLabel"),
  sessionNote: document.getElementById("sessionNote"),
  timeLimitLabel: document.getElementById("timeLimitLabel"),
  statusBanner: document.getElementById("statusBanner"),
  quizCard: document.getElementById("quizCard"),
  resultCard: document.getElementById("resultCard"),
  questionCounter: document.getElementById("questionCounter"),
  questionNumberBadge: document.getElementById("questionNumberBadge"),
  questionTimerBadge: document.getElementById("questionTimerBadge"),
  questionTitle: document.getElementById("questionTitle"),
  optionsList: document.getElementById("optionsList"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
  answeredCount: document.getElementById("answeredCount"),
  remainingCount: document.getElementById("remainingCount"),
  questionMap: document.getElementById("questionMap"),
  questionMapTitle: document.getElementById("questionMapTitle"),
  questionMapHint: document.getElementById("questionMapHint"),
  resultTitle: document.getElementById("resultTitle"),
  resultScore: document.getElementById("resultScore"),
  resultSummary: document.getElementById("resultSummary"),
  resultBody: document.getElementById("resultBody")
};

const letters = ["A", "B", "C", "D", "E"];
const storageKey = `quiz-progress:${location.pathname}`;

function t(key, ...args) {
  const value = translations[state.lang][key];
  return typeof value === "function" ? value(...args) : value;
}

function getRandomToggleLabel() {
  if (state.lang === "kg") {
    return state.randomMode ? "Тартип: аралаш" : "Тартип: ирети менен";
  }

  return state.randomMode ? "Порядок: случайный" : "Порядок: по порядку";
}

function renderSessionNote() {
  if (ui.sessionNote) {
    ui.sessionNote.textContent = t(state.sessionNoteKey);
  }
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

function stopQuestionTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updateTimerBadge() {
  if (!ui.questionTimerBadge) {
    return;
  }

  if (!state.started || state.showingResults || !questions.length) {
    ui.questionTimerBadge.textContent = "";
    ui.questionTimerBadge.classList.remove("question-badge--warning");
    return;
  }

  ui.questionTimerBadge.textContent = `${t("timeLeftLabel")}: ${t("timeValue", state.timeLeft)}`;
  ui.questionTimerBadge.classList.toggle("question-badge--warning", state.timeLeft <= 5);
}

function handleTimerExpired() {
  if (!state.started || state.showingResults || !questions.length) {
    return;
  }

  ui.statusBanner.textContent = t("timeExpired");
  if (state.currentIndex >= questions.length - 1) {
    showResults();
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

function startQuestionTimer() {
  stopQuestionTimer();
  if (!state.started || state.showingResults || !questions.length) {
    updateTimerBadge();
    return;
  }

  state.timeLimit = getSelectedTimeLimit();
  state.timeLeft = state.timeLimit;
  updateTimerBadge();
  state.timerId = window.setInterval(() => {
    if (!state.started || state.showingResults) {
      stopQuestionTimer();
      return;
    }

    state.timeLeft -= 1;
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

function clearSavedProgress() {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage failures and continue without persistence.
  }
}

function saveProgress() {
  const hasUsefulState = questions.length > 0 && (state.started || state.showingResults || getAnsweredCount() > 0);
  if (!hasUsefulState) {
    clearSavedProgress();
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify({
      lang: state.lang,
      started: state.started,
      currentIndex: state.currentIndex,
      answers: state.answers,
      limit: state.limit,
      randomMode: state.randomMode,
      showingResults: state.showingResults,
      questions,
      sourceTotal: sourceQuestions.length
    }));
  } catch {
    // Ignore storage failures and keep the quiz interactive.
  }
}

function restoreProgress() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return false;
    }

    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.questions) || saved.questions.length === 0) {
      return false;
    }

    if (saved.sourceTotal !== sourceQuestions.length) {
      return false;
    }

    questions = getOrderedQuestions(saved.questions).slice(0, saved.questions.length);
    state.lang = saved.lang === "kg" ? "kg" : "ru";
    state.started = Boolean(saved.started);
    state.answers = saved.answers && typeof saved.answers === "object" ? saved.answers : {};
    state.limit = Number.isFinite(saved.limit) ? saved.limit : saved.questions.length;
    state.randomMode = saved.randomMode !== false;
    state.currentIndex = Number.isInteger(saved.currentIndex)
      ? Math.min(Math.max(saved.currentIndex, 0), saved.questions.length - 1)
      : 0;
    state.showingResults = Boolean(saved.showingResults);
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

function getOrderedQuestions(items) {
  return [...items].sort((first, second) => first.number - second.number);
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
  if (!ui.questionLimit) {
    return sourceQuestions.length;
  }

  const limit = Number(ui.questionLimit.value);
  if (!Number.isFinite(limit) || limit <= 0) {
    return sourceQuestions.length;
  }

  return Math.min(limit, sourceQuestions.length);
}

function prepareVariant() {
  state.limit = getSelectedLimit();
  if (!state.randomMode || state.limit >= sourceQuestions.length) {
    questions = getOrderedQuestions(sourceQuestions).slice(0, state.limit);
    return;
  }

  questions = getOrderedQuestions(getRandomQuestions(sourceQuestions, state.limit));
}

function getQuestionText(question) {
  return state.lang === "ru" ? question.ru : question.kg;
}

function getQuestionOptions(question) {
  return state.lang === "ru" ? question.optionsRu : question.optionsKg;
}

function getCorrectIndex(question) {
  if (state.lang === "ru" && Number.isInteger(question.correctIndexRu)) {
    return question.correctIndexRu;
  }

  if (state.lang === "kg" && Number.isInteger(question.correctIndexKg)) {
    return question.correctIndexKg;
  }

  return question.correctIndex;
}

function getAnsweredCount() {
  return Object.keys(state.answers).length;
}

function hasAnswerKey(question) {
  const correctIndex = getCorrectIndex(question);
  return Number.isInteger(correctIndex) && correctIndex >= 0;
}

function countResults() {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let ungraded = 0;

  questions.forEach((question) => {
    if (!hasAnswerKey(question)) {
      ungraded += 1;
      return;
    }

    const answerIndex = state.answers[String(question.number)];
    const correctIndex = getCorrectIndex(question);
    if (answerIndex === undefined) {
      unanswered += 1;
      return;
    }

    if (answerIndex === correctIndex) {
      correct += 1;
    } else {
      wrong += 1;
    }
  });

  return { correct, wrong, unanswered, ungraded };
}

function updateLanguageButtons() {
  ui.langRu.classList.toggle("chip--active", state.lang === "ru");
  ui.langKg.classList.toggle("chip--active", state.lang === "kg");
  ui.questionMapTitle.textContent = t("mapTitle");
  ui.questionMapHint.textContent = t("mapHint");
  ui.startBtn.textContent = t("startLabel");
  if (ui.inlinePrevBtn) {
    ui.inlinePrevBtn.textContent = state.lang === "kg" ? "Артка" : "Назад";
  }
  if (ui.inlineNextBtn) {
    ui.inlineNextBtn.textContent = state.lang === "kg" ? "Кийинки" : "Далее";
  }
  ui.finishBtn.textContent = t("finishLabel");
  ui.resetBtn.textContent = t("resetLabel");
  if (ui.newVariantBtn) {
    ui.newVariantBtn.textContent = t("newVariantLabel");
  }
  if (ui.randomToggleBtn) {
    ui.randomToggleBtn.textContent = getRandomToggleLabel();
  }
  if (ui.jumpLabel) {
    ui.jumpLabel.textContent = t("jumpLabel");
  }
  if (ui.jumpBtn) {
    ui.jumpBtn.textContent = t("jumpButtonLabel");
  }
  if (ui.jumpInput) {
    ui.jumpInput.placeholder = t("jumpPlaceholder");
  }
  if (ui.timeLimitLabel) {
    ui.timeLimitLabel.textContent = t("timeLimitLabel");
  }
  updateTimerBadge();
  renderSessionNote();
}

function canReturnToPreviousQuestion() {
  return state.started && state.showingResults && state.currentIndex > 0;
}

function hasCurrentQuestionAnswer() {
  if (!state.started || !questions.length) {
    return false;
  }

  const currentQuestion = questions[state.currentIndex];
  return state.answers[String(currentQuestion.number)] !== undefined;
}

function canOpenQuestionAtIndex(index) {
  if (!state.started) {
    return false;
  }

  if (index < 0 || index >= questions.length) {
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
  const atEnd = state.currentIndex === questions.length - 1;
  const prevDisabled = !canReturnToPreviousQuestion();
  const nextDisabled = !state.started || atEnd || !hasCurrentQuestionAnswer();
  if (ui.prevBtn) {
    ui.prevBtn.disabled = prevDisabled;
  }
  if (ui.nextBtn) {
    ui.nextBtn.disabled = nextDisabled;
  }
  if (ui.inlinePrevBtn) {
    ui.inlinePrevBtn.disabled = prevDisabled;
  }
  if (ui.inlineNextBtn) {
    ui.inlineNextBtn.disabled = nextDisabled;
  }
  ui.finishBtn.disabled = !state.started;
  ui.resetBtn.disabled = !state.started && getAnsweredCount() === 0;
  if (ui.questionLimit) {
    ui.questionLimit.disabled = state.started;
  }
  if (ui.questionTimeLimit) {
    ui.questionTimeLimit.disabled = state.started;
  }
  if (ui.newVariantBtn) {
    ui.newVariantBtn.disabled = sourceQuestions.length === 0;
  }
  if (ui.jumpInput) {
    ui.jumpInput.disabled = questions.length === 0;
  }
  if (ui.jumpBtn) {
    ui.jumpBtn.disabled = questions.length === 0;
  }
}

function renderQuestionMap() {
  ui.questionMap.innerHTML = "";

  questions.forEach((question, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-button";
    btn.textContent = question.number;
    btn.classList.toggle("map-button--current", index === state.currentIndex && state.started);
    btn.classList.toggle("map-button--answered", state.answers[String(question.number)] !== undefined);
    btn.disabled = state.started && !canOpenQuestionAtIndex(index);

    btn.addEventListener("click", () => {
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

    ui.questionMap.appendChild(btn);
  });
}

function updateProgress() {
  const answered = getAnsweredCount();
  const total = questions.length;
  const percent = total ? Math.round((answered / total) * 100) : 0;

  ui.progressText.textContent = t("progressText", answered, total);
  ui.progressBar.style.width = `${percent}%`;
  ui.answeredCount.textContent = `${answered} ${t("answeredText")}`;
  ui.remainingCount.textContent = `${Math.max(total - answered, 0)} ${t("remainingText")}`;

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

function answerCurrentQuestion(index) {
  if (!state.started || !questions.length) {
    return;
  }

  const question = questions[state.currentIndex];
  const options = getQuestionOptions(question);
  if (index < 0 || index >= options.length) {
    return;
  }

  state.answers[String(question.number)] = index;
  renderQuestion();
}

function goToQuestionNumber(rawValue) {
  const questionNumber = Number(rawValue);
  if (!Number.isInteger(questionNumber) || questionNumber <= 0) {
    return;
  }

  if (!state.started) {
    startQuiz();
  }

  const questionIndex = questions.findIndex((item) => item.number === questionNumber);
  if (questionIndex === -1) {
    ui.statusBanner.textContent = t("jumpMissing", questionNumber);
    return;
  }

  if (!canOpenQuestionAtIndex(questionIndex)) {
    return;
  }

  state.currentIndex = questionIndex;
  renderQuestion();
  scrollIntoViewIfNeeded();
}

function renderQuestion() {
  const question = questions[state.currentIndex];
  const options = getQuestionOptions(question);
  const key = String(question.number);

  ui.quizCard.classList.remove("hidden");
  ui.resultCard.classList.add("hidden");
  state.showingResults = false;
  ui.questionCounter.textContent = `${state.currentIndex + 1} / ${questions.length}`;
  ui.questionNumberBadge.textContent = `${t("questionPrefix")}${question.number}`;
  ui.questionTitle.textContent = getQuestionText(question);
  ui.optionsList.innerHTML = "";

  options.forEach((optionText, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "option-item";

    const input = document.createElement("input");
    input.className = "option-input";
    input.type = "radio";
    input.name = `question-${question.number}`;
    input.id = `q${question.number}-${index}`;
    input.checked = state.answers[key] === index;

    input.addEventListener("change", () => {
      state.answers[key] = index;
      updateProgress();
      saveProgress();
    });

    const label = document.createElement("label");
    label.className = "option-label";
    label.setAttribute("for", input.id);
    label.dataset.letter = letters[index] || "?";
    label.textContent = optionText;

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    ui.optionsList.appendChild(wrapper);
  });

  ui.statusBanner.textContent = t("statusQuestion");
  updateProgress();
  startQuestionTimer();
  saveProgress();
}

function startQuiz() {
  prepareVariant();
  state.started = true;
  state.currentIndex = 0;
  state.answers = {};
  state.showingResults = false;
  state.sessionNoteKey = "sessionNote";
  stopQuestionTimer();
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
  if (!state.started || state.currentIndex >= questions.length - 1 || !hasCurrentQuestionAnswer()) {
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
  scrollIntoViewIfNeeded();
}

function showResults() {
  stopQuestionTimer();
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.remove("hidden");
  state.showingResults = true;
  ui.resultBody.innerHTML = "";
  ui.resultTitle.textContent = t("resultTitle");

  questions.forEach((question) => {
    const options = getQuestionOptions(question);
    const answerIndex = state.answers[String(question.number)];
    const correctIndex = getCorrectIndex(question);
    const isAnswered = answerIndex !== undefined;
    const isCorrect = isAnswered && hasAnswerKey(question) && answerIndex === correctIndex;
    const answerText = answerIndex === undefined
      ? t("noAnswer")
      : `${letters[answerIndex]}. ${options[answerIndex]}`;
    const correctText = !hasAnswerKey(question) || options[correctIndex] === undefined
      ? t("noKey")
      : `${letters[correctIndex]}. ${options[correctIndex]}`;

    const row = document.createElement("tr");
    row.className = !hasAnswerKey(question)
      ? "result-row result-row--ungraded"
      : !isAnswered
        ? "result-row result-row--skipped"
        : isCorrect
          ? "result-row result-row--correct"
          : "result-row result-row--wrong";
    row.innerHTML = `
      <td>${question.number}</td>
      <td>${getQuestionText(question)}</td>
      <td>${answerText}</td>
      <td>${correctText}</td>
    `;
    ui.resultBody.appendChild(row);
  });

  const answered = getAnsweredCount();
  const { correct, wrong, unanswered, ungraded } = countResults();
  const gradable = questions.length - ungraded;
  const percent = gradable ? Math.round((correct / gradable) * 100) : 0;
  ui.resultScore.textContent = gradable
    ? t("resultScore", correct, gradable, percent)
    : t("resultScoreNoKey", questions.length);
  ui.resultSummary.textContent = t("resultSummary", answered, questions.length, gradable, correct, wrong, unanswered, ungraded);
  ui.statusBanner.textContent = t("statusResult");
  updateProgress();
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
  state.sessionNoteKey = "sessionNote";
  renderSessionNote();
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.add("hidden");
  ui.statusBanner.textContent = t("statusIdle");
  updateProgress();
  clearSavedProgress();
}

ui.langRu.addEventListener("click", () => {
  state.lang = "ru";
  updateLanguageButtons();

  if (!ui.resultCard.classList.contains("hidden")) {
    showResults();
  } else if (state.started) {
    renderQuestion();
  } else {
    resetQuiz();
  }
});

ui.langKg.addEventListener("click", () => {
  state.lang = "kg";
  updateLanguageButtons();

  if (!ui.resultCard.classList.contains("hidden")) {
    showResults();
  } else if (state.started) {
    renderQuestion();
  } else {
    resetQuiz();
  }
});

ui.startBtn.addEventListener("click", startQuiz);

if (ui.prevBtn) {
  ui.prevBtn.addEventListener("click", goToPreviousQuestion);
}

if (ui.nextBtn) {
  ui.nextBtn.addEventListener("click", goToNextQuestion);
}

if (ui.inlinePrevBtn) {
  ui.inlinePrevBtn.addEventListener("click", goToPreviousQuestion);
}

if (ui.inlineNextBtn) {
  ui.inlineNextBtn.addEventListener("click", goToNextQuestion);
}

ui.finishBtn.addEventListener("click", () => {
  if (!state.started) {
    return;
  }
  showResults();
});

ui.resetBtn.addEventListener("click", resetQuiz);

if (ui.jumpBtn) {
  ui.jumpBtn.addEventListener("click", () => {
    goToQuestionNumber(ui.jumpInput?.value);
  });
}

if (ui.jumpInput) {
  ui.jumpInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToQuestionNumber(ui.jumpInput.value);
    }
  });
}

if (ui.newVariantBtn) {
  ui.newVariantBtn.addEventListener("click", startQuiz);
}

if (ui.randomToggleBtn) {
  ui.randomToggleBtn.addEventListener("click", () => {
    state.randomMode = !state.randomMode;
    updateLanguageButtons();

    if (state.started || getAnsweredCount() > 0 || questions.length > 0) {
      resetQuiz();
    } else {
      saveProgress();
    }
  });
}

if (ui.questionLimit) {
  ui.questionLimit.addEventListener("change", () => {
    if (!state.started) {
      resetQuiz();
    }
  });
}


if (ui.questionTimeLimit) {
  ui.questionTimeLimit.addEventListener("change", () => {
    if (!state.started) {
      resetQuiz();
    }
  });
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const tagName = target?.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return;
  }

  if (!state.started || state.showingResults) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (ui.inlinePrevBtn) {
      ui.inlinePrevBtn.click();
    } else if (ui.prevBtn) {
      ui.prevBtn.click();
    }
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (ui.inlineNextBtn) {
      ui.inlineNextBtn.click();
    } else if (ui.nextBtn) {
      ui.nextBtn.click();
    }
    return;
  }

  if (/^[1-5]$/.test(event.key)) {
    event.preventDefault();
    answerCurrentQuestion(Number(event.key) - 1);
  }
});

updateLanguageButtons();
if (restoreProgress()) {
  if (state.showingResults) {
    showResults();
  } else {
    renderQuestion();
  }
} else {
  resetQuiz();
}
