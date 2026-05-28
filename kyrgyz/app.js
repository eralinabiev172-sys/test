const data = window.kyrgyzTests || {};

const state = {
  subject: "language",
  level: "B1",
  started: false,
  currentIndex: 0,
  answers: {},
  showingResults: false,
  randomMode: true
};

const ui = {
  subjectLanguageBtn: document.getElementById("subjectLanguageBtn"),
  subjectLiteratureBtn: document.getElementById("subjectLiteratureBtn"),
  levelB1Btn: document.getElementById("levelB1Btn"),
  levelB2Btn: document.getElementById("levelB2Btn"),
  randomToggleBtn: document.getElementById("randomToggleBtn"),
  startBtn: document.getElementById("startBtn"),
  resetLevelBtn: document.getElementById("resetLevelBtn"),
  finishBtn: document.getElementById("finishBtn"),
  resetBtn: document.getElementById("resetBtn"),
  heroQuestionCount: document.getElementById("heroQuestionCount"),
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
  questionMapTitle: document.getElementById("questionMapTitle"),
  questionMapHint: document.getElementById("questionMapHint"),
  questionMap: document.getElementById("questionMap"),
  resultTitle: document.getElementById("resultTitle"),
  resultScore: document.getElementById("resultScore"),
  resultSummary: document.getElementById("resultSummary"),
  resultBody: document.getElementById("resultBody"),
  inlinePrevBtn: document.getElementById("inlinePrevBtn"),
  inlineNextBtn: document.getElementById("inlineNextBtn")
};

const optionLabels = ["А", "Б", "В", "Г", "Д"];

function getQuestions() {
  const subjectData = data[state.subject] || {};
  return Array.isArray(subjectData[state.level]) ? subjectData[state.level] : [];
}

function getVariantQuestions() {
  const questions = [...getQuestions()];
  if (!state.randomMode) {
    return questions;
  }

  for (let index = questions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [questions[index], questions[swapIndex]] = [questions[swapIndex], questions[index]];
  }

  return questions;
}

function getCurrentQuestion() {
  return getQuestions()[state.currentIndex] || null;
}

function getAnsweredCount() {
  return Object.keys(state.answers).length;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function optionLetter(index) {
  return optionLabels[index] || String(index + 1);
}

function getSubjectLabel() {
  return state.subject === "literature" ? "Кыргыз адабияты" : "Кыргыз тили";
}

function setBanner(message) {
  ui.statusBanner.textContent = message;
}

function updateSelectionButtons() {
  ui.subjectLanguageBtn.classList.toggle("chip--active", state.subject === "language");
  ui.subjectLiteratureBtn.classList.toggle("chip--active", state.subject === "literature");
  ui.levelB1Btn.classList.toggle("chip--active", state.level === "B1");
  ui.levelB2Btn.classList.toggle("chip--active", state.level === "B2");
  ui.randomToggleBtn.textContent = state.randomMode ? "Туш келди: күйүк" : "Туш келди: өчүк";
  ui.heroQuestionCount.textContent = String(getQuestions().length);
}

function resetSession() {
  state.started = false;
  state.currentIndex = 0;
  state.answers = {};
  state.showingResults = false;
  state.questions = [];
  ui.resultCard.classList.add("hidden");
  ui.quizCard.classList.add("hidden");
  setBanner("«Тестти баштоо» баскычын басып, суроолорду жүктө.");
  renderProgress();
  renderQuestionMap();
}

function setSubject(subject) {
  if (!data[subject]) {
    return;
  }

  state.subject = subject;
  updateSelectionButtons();
  resetSession();
  setBanner(`Тандалды: ${getSubjectLabel()}.`);
}

function setLevel(level) {
  const subjectData = data[state.subject] || {};
  if (!subjectData[level]) {
    return;
  }

  state.level = level;
  updateSelectionButtons();
  resetSession();
  setBanner(`Тандалды: ${getSubjectLabel()} · деңгээл ${level}. «Тестти баштоо» баскычын бас.`);
}

function startQuiz() {
  const questions = getVariantQuestions();
  if (!questions.length) {
    setBanner("Бул деңгээл үчүн азырынча суроолор жок.");
    return;
  }

  state.started = true;
  state.showingResults = false;
  state.currentIndex = 0;
  state.answers = {};
  state.questions = questions;
  ui.resultCard.classList.add("hidden");
  ui.quizCard.classList.remove("hidden");
  setBanner(`Тема ${getSubjectLabel()} · деңгээл ${state.level} жүктөлдү. Жооп тандап, кийинки суроого өт.`);
  renderQuestion();
  renderProgress();
  renderQuestionMap();
}

function renderProgress() {
  const total = getQuestions().length;
  const answered = getAnsweredCount();
  const remaining = Math.max(total - answered, 0);
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  ui.progressText.textContent = `${answered} / ${total} жооп берилди`;
  ui.progressBar.style.width = `${percent}%`;
  ui.answeredCount.textContent = `${answered} жооп берилди`;
  ui.remainingCount.textContent = `${remaining} калды`;
}

function renderQuestionMap() {
  const questions = state.started && Array.isArray(state.questions) && state.questions.length ? state.questions : getQuestions();
  ui.questionMap.innerHTML = "";

  questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-button";
    if (index === state.currentIndex && state.started && !state.showingResults) {
      button.classList.add("map-button--current");
    }
    if (Object.prototype.hasOwnProperty.call(state.answers, index)) {
      button.classList.add("map-button--answered");
    }
    button.textContent = String(question.number || index + 1);
    button.addEventListener("click", () => {
      state.currentIndex = index;
      state.started = true;
      state.showingResults = false;
      ui.quizCard.classList.remove("hidden");
      ui.resultCard.classList.add("hidden");
      renderQuestion();
      renderQuestionMap();
    });
    ui.questionMap.appendChild(button);
  });
}

function renderQuestion() {
  const questions = state.started && Array.isArray(state.questions) && state.questions.length ? state.questions : getQuestions();
  const question = questions[state.currentIndex] || null;

  if (!question) {
    ui.questionCounter.textContent = "";
    ui.questionNumberBadge.textContent = "";
    ui.questionTitle.textContent = "";
    ui.optionsList.innerHTML = "";
    return;
  }

  ui.questionCounter.textContent = `Суроо ${state.currentIndex + 1} / ${questions.length}`;
  ui.questionNumberBadge.textContent = `№ ${question.number || state.currentIndex + 1}`;
  ui.questionTitle.textContent = question.text;
  ui.optionsList.innerHTML = "";

  question.options.forEach((option, index) => {
    const optionWrap = document.createElement("div");
    optionWrap.className = "option-item";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = `question-${state.currentIndex}`;
    input.id = `question-${state.currentIndex}-option-${index}`;
    input.className = "option-input";
    input.checked = state.answers[state.currentIndex] === index;
    input.addEventListener("change", () => {
      state.answers[state.currentIndex] = index;
      renderQuestion();
      renderProgress();
      renderQuestionMap();
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
}

function countResults() {
  const questions = state.started && Array.isArray(state.questions) && state.questions.length ? state.questions : getQuestions();
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let ungraded = 0;

  questions.forEach((question, index) => {
    const answer = state.answers[index];
    if (answer === undefined) {
      unanswered += 1;
      return;
    }
    if (!Number.isInteger(question.correctIndex)) {
      ungraded += 1;
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

function renderResults() {
  const questions = state.started && Array.isArray(state.questions) && state.questions.length ? state.questions : getQuestions();
  const { correct, wrong, unanswered, ungraded } = countResults();
  const total = questions.length;
  const scored = total - ungraded;
  const percent = scored > 0 ? Math.round((correct / scored) * 100) : 0;
  const answered = getAnsweredCount();

  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.remove("hidden");
  state.showingResults = true;

  ui.resultTitle.textContent = `Жыйынтык · ${getSubjectLabel()} · ${state.level}`;
  ui.resultScore.textContent = `${correct} / ${scored} туура · ${percent}%`;
  ui.resultSummary.textContent =
    `Жооп берилди: ${answered} / ${total}. Туура: ${correct}. Туура эмес: ${wrong}. ` +
    `Жоопсуз: ${unanswered}. Ачкычсыз: ${ungraded}.`;

  ui.resultBody.innerHTML = "";
  questions.forEach((question, index) => {
    const answer = state.answers[index];
    const row = document.createElement("tr");
    const selectedText = answer === undefined ? "Жооп жок" : `${optionLetter(answer)} · ${question.options[answer] || ""}`;
    const correctText = Number.isInteger(question.correctIndex)
      ? `${optionLetter(question.correctIndex)} · ${question.options[question.correctIndex] || ""}`
      : "Жооп ачкычы жок";
    row.innerHTML = `
      <td>${question.number || index + 1}</td>
      <td>${escapeHtml(question.text)}</td>
      <td>${escapeHtml(selectedText)}</td>
      <td>${escapeHtml(correctText)}</td>
    `;
    ui.resultBody.appendChild(row);
  });
}

function moveQuestion(direction) {
  const questions = state.started && Array.isArray(state.questions) && state.questions.length ? state.questions : getQuestions();
  if (!questions.length) {
    return;
  }

  state.currentIndex = Math.max(0, Math.min(state.currentIndex + direction, questions.length - 1));
  state.started = true;
  state.showingResults = false;
  ui.resultCard.classList.add("hidden");
  ui.quizCard.classList.remove("hidden");
  renderQuestion();
  renderQuestionMap();
}

ui.subjectLanguageBtn.addEventListener("click", () => setSubject("language"));
ui.subjectLiteratureBtn.addEventListener("click", () => setSubject("literature"));
ui.levelB1Btn.addEventListener("click", () => setLevel("B1"));
ui.levelB2Btn.addEventListener("click", () => setLevel("B2"));
ui.randomToggleBtn.addEventListener("click", () => {
  state.randomMode = !state.randomMode;
  updateSelectionButtons();
  resetSession();
});
ui.startBtn.addEventListener("click", startQuiz);
ui.resetLevelBtn.addEventListener("click", () => setLevel(state.level));
ui.finishBtn.addEventListener("click", renderResults);
ui.resetBtn.addEventListener("click", resetSession);
ui.inlinePrevBtn.addEventListener("click", () => moveQuestion(-1));
ui.inlineNextBtn.addEventListener("click", () => moveQuestion(1));

updateSelectionButtons();
resetSession();
