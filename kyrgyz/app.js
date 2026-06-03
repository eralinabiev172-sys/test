const sourceQuestions = Array.isArray(window.kyrgyzTests?.language?.B1) ? window.kyrgyzTests.language.B1 : [];

const state = {
  started: false,
  showingResults: false,
  currentIndex: 0,
  randomMode: true,
  questions: [],
  answers: {}
};

const ui = {
  randomToggleBtn: document.getElementById("randomToggleBtn"),
  startBtn: document.getElementById("startBtn"),
  finishBtn: document.getElementById("finishBtn"),
  resetBtn: document.getElementById("resetBtn"),
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
  questionTitle: document.getElementById("questionTitle"),
  optionsList: document.getElementById("optionsList"),
  inlinePrevBtn: document.getElementById("inlinePrevBtn"),
  inlineNextBtn: document.getElementById("inlineNextBtn"),
  resultTitle: document.getElementById("resultTitle"),
  resultScore: document.getElementById("resultScore"),
  resultSummary: document.getElementById("resultSummary"),
  resultBody: document.getElementById("resultBody")
};

const letters = ["А", "Б", "В", "Г"];

function getQuestions() {
  return state.started && state.questions.length ? state.questions : sourceQuestions;
}

function shuffle(list) {
  const items = [...list];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function setBanner(text) {
  ui.statusBanner.textContent = text;
}

function getAnsweredCount() {
  return Object.keys(state.answers).length;
}

function optionLetter(index) {
  return letters[index] || String(index + 1);
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function updateControls() {
  ui.randomToggleBtn.textContent = state.randomMode ? "Туш келди: күйүк" : "Туш келди: өчүк";
  ui.heroQuestionCount.textContent = String(sourceQuestions.length);
}

function renderProgress() {
  const total = getQuestions().length;
  const answered = getAnsweredCount();
  const remaining = Math.max(total - answered, 0);
  const percent = total ? Math.round((answered / total) * 100) : 0;

  ui.progressText.textContent = `${answered} / ${total} жооп берилди`;
  ui.progressBar.style.width = `${percent}%`;
  ui.answeredCount.textContent = `${answered} жооп берилди`;
  ui.remainingCount.textContent = `${remaining} калды`;
}

function renderQuestionMap() {
  const questions = getQuestions();
  ui.questionMap.innerHTML = "";

  questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-button";
    if (state.started && !state.showingResults && index === state.currentIndex) {
      button.classList.add("map-button--current");
    }
    if (Object.prototype.hasOwnProperty.call(state.answers, index)) {
      button.classList.add("map-button--answered");
    }
    button.textContent = String(question.number || index + 1);
    button.addEventListener("click", () => {
      state.started = true;
      state.showingResults = false;
      state.currentIndex = index;
      ui.quizCard.classList.remove("hidden");
      ui.resultCard.classList.add("hidden");
      renderQuestion();
      renderQuestionMap();
    });
    ui.questionMap.appendChild(button);
  });
}

function renderQuestion() {
  const questions = getQuestions();
  const question = questions[state.currentIndex];

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
      renderQuestionMap();
      renderProgress();
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

  ui.inlinePrevBtn.disabled = state.currentIndex === 0;
  ui.inlineNextBtn.disabled = state.currentIndex === questions.length - 1;
}

function goToQuestion(direction) {
  const questions = getQuestions();
  const nextIndex = state.currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= questions.length) {
    return;
  }
  state.currentIndex = nextIndex;
  renderQuestion();
  renderQuestionMap();
}

function startQuiz() {
  if (!sourceQuestions.length) {
    setBanner("Суроолор азырынча жүктөлгөн жок.");
    return;
  }

  state.started = true;
  state.showingResults = false;
  state.currentIndex = 0;
  state.answers = {};
  state.questions = state.randomMode ? shuffle(sourceQuestions) : [...sourceQuestions];
  ui.quizCard.classList.remove("hidden");
  ui.resultCard.classList.add("hidden");
  setBanner("Кыргыз тили — B1 тести жүктөлдү. Жооп тандап, кийинки суроого өт.");
  renderQuestion();
  renderProgress();
  renderQuestionMap();
}

function resetSession() {
  state.started = false;
  state.showingResults = false;
  state.currentIndex = 0;
  state.questions = [];
  state.answers = {};
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.add("hidden");
  setBanner("«Тестти баштоо» баскычын басып, суроолорду жүктө.");
  renderProgress();
  renderQuestionMap();
}

function countResults() {
  const questions = getQuestions();
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  questions.forEach((question, index) => {
    const answer = state.answers[index];
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

  return { correct, wrong, unanswered };
}

function showResults() {
  const questions = getQuestions();
  const { correct, wrong, unanswered } = countResults();
  const answered = getAnsweredCount();

  state.showingResults = true;
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.remove("hidden");

  ui.resultScore.textContent = `${correct} / ${questions.length}`;
  ui.resultSummary.textContent = `Жооп берилди: ${answered}. Туура: ${correct}. Туура эмес: ${wrong}. Жоопсуз: ${unanswered}.`;
  ui.resultBody.innerHTML = "";

  questions.forEach((question, index) => {
    const answer = state.answers[index];
    const selectedText = answer === undefined
      ? "Жооп жок"
      : `${optionLetter(answer)} · ${question.options[answer] || ""}`;
    const correctText = Number.isInteger(question.correctIndex)
      ? `${optionLetter(question.correctIndex)} · ${question.options[question.correctIndex] || ""}`
      : "—";

    const row = document.createElement("tr");
    row.className = answer === question.correctIndex ? "result-row--correct" : "result-row--wrong";
    row.innerHTML = `
      <td>${question.number || index + 1}</td>
      <td>${escapeHtml(question.text)}</td>
      <td>${escapeHtml(selectedText)}</td>
      <td>${escapeHtml(correctText)}</td>
    `;
    ui.resultBody.appendChild(row);
  });

  setBanner("Жыйынтык даяр. Кааласаң, кайра баштасаң болот.");
}

ui.startBtn.addEventListener("click", startQuiz);
ui.finishBtn.addEventListener("click", () => {
  if (!state.started) {
    setBanner("Адегенде тестти башта.");
    return;
  }
  showResults();
});
ui.resetBtn.addEventListener("click", resetSession);
ui.randomToggleBtn.addEventListener("click", () => {
  state.randomMode = !state.randomMode;
  updateControls();
  if (!state.started) {
    return;
  }
  setBanner(state.randomMode ? "Туш келди тартип күйгүзүлдү." : "Туш келди тартип өчүрүлдү.");
});
ui.inlinePrevBtn.addEventListener("click", () => goToQuestion(-1));
ui.inlineNextBtn.addEventListener("click", () => goToQuestion(1));

updateControls();
resetSession();
