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
    noKey: "Ключ не задан",
    resultTitle: "Твои ответы",
    resultSummary: (answered, total, correct, wrong, unanswered) =>
      `Отвечено: ${answered} из ${total}. Правильно: ${correct}. Неправильно: ${wrong}. Без ответа: ${unanswered}.`,
    resultScore: (correct, total, percent) => `${correct} из ${total} верно · ${percent}%`,
    mapTitle: "Карта вопросов",
    mapHint: "Нажми на номер, чтобы быстро перейти",
    startLabel: "Начать тест",
    finishLabel: "Завершить",
    resetLabel: "Сбросить",
    newVariantLabel: "Новый вариант"
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
    noKey: "Туура жооп берилген эмес",
    resultTitle: "Сенин жоопторуң",
    resultSummary: (answered, total, correct, wrong, unanswered) =>
      `Жооп берилгени: ${answered} / ${total}. Туурасы: ${correct}. Туура эмеси: ${wrong}. Жоопсуз: ${unanswered}.`,
    resultScore: (correct, total, percent) => `${correct} / ${total} туура · ${percent}%`,
    mapTitle: "Суроолор картасы",
    mapHint: "Тез өтүү үчүн номерди бас",
    startLabel: "Тестти баштоо",
    finishLabel: "Аяктоо",
    resetLabel: "Тазалоо",
    newVariantLabel: "Жаңы вариант"
  }
};

const state = {
  lang: "ru",
  started: false,
  currentIndex: 0,
  answers: {},
  limit: null
};

const ui = {
  langRu: document.getElementById("langRu"),
  langKg: document.getElementById("langKg"),
  startBtn: document.getElementById("startBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  finishBtn: document.getElementById("finishBtn"),
  resetBtn: document.getElementById("resetBtn"),
  newVariantBtn: document.getElementById("newVariantBtn"),
  questionLimit: document.getElementById("questionLimit"),
  statusBanner: document.getElementById("statusBanner"),
  quizCard: document.getElementById("quizCard"),
  resultCard: document.getElementById("resultCard"),
  questionCounter: document.getElementById("questionCounter"),
  questionNumberBadge: document.getElementById("questionNumberBadge"),
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

function t(key, ...args) {
  const value = translations[state.lang][key];
  return typeof value === "function" ? value(...args) : value;
}

function shuffleQuestions(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function shuffleQuestionOptions(question) {
  const optionPairs = question.optionsKg.map((optionKg, index) => ({
    optionKg,
    optionRu: question.optionsRu[index],
    originalIndex: index
  }));

  for (let index = optionPairs.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [optionPairs[index], optionPairs[swapIndex]] = [optionPairs[swapIndex], optionPairs[index]];
  }

  return {
    ...question,
    optionsKg: optionPairs.map((item) => item.optionKg),
    optionsRu: optionPairs.map((item) => item.optionRu),
    correctIndex: optionPairs.findIndex((item) => item.originalIndex === question.correctIndex)
  };
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
  questions = shuffleQuestions(sourceQuestions)
    .slice(0, state.limit)
    .map(shuffleQuestionOptions);
}

function getQuestionText(question) {
  return state.lang === "ru" ? question.ru : question.kg;
}

function getQuestionOptions(question) {
  return state.lang === "ru" ? question.optionsRu : question.optionsKg;
}

function getAnsweredCount() {
  return Object.keys(state.answers).length;
}

function countResults() {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  questions.forEach((question) => {
    const answerIndex = state.answers[String(question.number)];
    if (answerIndex === undefined) {
      unanswered += 1;
      return;
    }

    if (answerIndex === question.correctIndex) {
      correct += 1;
    } else {
      wrong += 1;
    }
  });

  return { correct, wrong, unanswered };
}

function updateLanguageButtons() {
  ui.langRu.classList.toggle("chip--active", state.lang === "ru");
  ui.langKg.classList.toggle("chip--active", state.lang === "kg");
  ui.questionMapTitle.textContent = t("mapTitle");
  ui.questionMapHint.textContent = t("mapHint");
  ui.startBtn.textContent = t("startLabel");
  ui.finishBtn.textContent = t("finishLabel");
  ui.resetBtn.textContent = t("resetLabel");
  if (ui.newVariantBtn) {
    ui.newVariantBtn.textContent = t("newVariantLabel");
  }
}

function updateControls() {
  const atStart = state.currentIndex === 0;
  const atEnd = state.currentIndex === questions.length - 1;
  ui.prevBtn.disabled = !state.started || atStart;
  ui.nextBtn.disabled = !state.started || atEnd;
  ui.finishBtn.disabled = !state.started;
  ui.resetBtn.disabled = !state.started && getAnsweredCount() === 0;
  if (ui.questionLimit) {
    ui.questionLimit.disabled = state.started;
  }
  if (ui.newVariantBtn) {
    ui.newVariantBtn.disabled = sourceQuestions.length === 0;
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

    btn.addEventListener("click", () => {
      if (!state.started) {
        startQuiz();
      }
      state.currentIndex = index;
      renderQuestion();
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

function renderQuestion() {
  const question = questions[state.currentIndex];
  const options = getQuestionOptions(question);
  const key = String(question.number);

  ui.quizCard.classList.remove("hidden");
  ui.resultCard.classList.add("hidden");
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
}

function startQuiz() {
  prepareVariant();
  state.started = true;
  state.currentIndex = 0;
  state.answers = {};
  renderQuestion();
}

function showResults() {
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.remove("hidden");
  ui.resultBody.innerHTML = "";
  ui.resultTitle.textContent = t("resultTitle");

  questions.forEach((question) => {
    const options = getQuestionOptions(question);
    const answerIndex = state.answers[String(question.number)];
    const correctIndex = question.correctIndex;
    const answerText = answerIndex === undefined
      ? t("noAnswer")
      : `${letters[answerIndex]}. ${options[answerIndex]}`;
    const correctText = correctIndex === undefined || options[correctIndex] === undefined
      ? t("noKey")
      : `${letters[correctIndex]}. ${options[correctIndex]}`;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${question.number}</td>
      <td>${getQuestionText(question)}</td>
      <td>${answerText}</td>
      <td>${correctText}</td>
    `;
    ui.resultBody.appendChild(row);
  });

  const answered = getAnsweredCount();
  const { correct, wrong, unanswered } = countResults();
  const percent = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  ui.resultScore.textContent = t("resultScore", correct, questions.length, percent);
  ui.resultSummary.textContent = t("resultSummary", answered, questions.length, correct, wrong, unanswered);
  ui.statusBanner.textContent = t("statusResult");
  updateProgress();
}

function resetQuiz() {
  prepareVariant();
  state.started = false;
  state.currentIndex = 0;
  state.answers = {};
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.add("hidden");
  ui.statusBanner.textContent = t("statusIdle");
  updateProgress();
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

ui.prevBtn.addEventListener("click", () => {
  if (!state.started || state.currentIndex === 0) {
    return;
  }
  state.currentIndex -= 1;
  renderQuestion();
});

ui.nextBtn.addEventListener("click", () => {
  if (!state.started || state.currentIndex >= questions.length - 1) {
    return;
  }
  state.currentIndex += 1;
  renderQuestion();
});

ui.finishBtn.addEventListener("click", () => {
  if (!state.started) {
    return;
  }
  showResults();
});

ui.resetBtn.addEventListener("click", resetQuiz);

if (ui.newVariantBtn) {
  ui.newVariantBtn.addEventListener("click", startQuiz);
}

if (ui.questionLimit) {
  ui.questionLimit.addEventListener("change", () => {
    if (!state.started) {
      resetQuiz();
    }
  });
}

updateLanguageButtons();
resetQuiz();
