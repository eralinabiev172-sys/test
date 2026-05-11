const state = {
  lang: "ru",
  started: false,
  currentIndex: 0,
  answers: {}
};

const ui = {
  langRu: document.getElementById("langRu"),
  langKg: document.getElementById("langKg"),
  startBtn: document.getElementById("startBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  finishBtn: document.getElementById("finishBtn"),
  resetBtn: document.getElementById("resetBtn"),
  statusBanner: document.getElementById("statusBanner"),
  quizCard: document.getElementById("quizCard"),
  resultCard: document.getElementById("resultCard"),
  questionCounter: document.getElementById("questionCounter"),
  questionNumberBadge: document.getElementById("questionNumberBadge"),
  questionTitle: document.getElementById("questionTitle"),
  optionsList: document.getElementById("optionsList"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
  resultSummary: document.getElementById("resultSummary"),
  resultBody: document.getElementById("resultBody")
};

const questions = [
  {
    number: 1,
    kg: "КРнын аймагы кайсы тоо системасына таандык?",
    ru: "К какой горной системе относится территория КР?",
    optionsKg: ["Памир", "Алтай", "Урал", "Тянь-Шань"],
    optionsRu: ["Памирской", "Алтайской", "Уральской", "Тянь-Шанской"],
    correctIndex: 3
  },
  {
    number: 2,
    kg: "КРсында кайсы геологиялык бүктөлүү басымдуулук кылат?",
    ru: "Какая геологическая складчатость преобладает в КР?",
    optionsKg: ["Байкал", "Альпы", "Каледон", "Герцин"],
    optionsRu: ["Байкальская", "Альпийская", "Каледонская", "Герцинская"],
    correctIndex: 1
  },
  {
    number: 3,
    kg: "Кыргыз Республикасынын чек арасынын узундугу канча?",
    ru: "Какова протяжённость границы Кыргызстана?",
    optionsKg: ["5432 км", "4567 км", "4508 км", "3456 км"],
    optionsRu: ["5432 км", "4567 км", "4508 км", "3456 км"],
    correctIndex: 2
  },
  {
    number: 4,
    kg: "Кыргыз Республикасын Алай жана Түркстан тоо кыркалары кайсы өлкөдөн бөлүп турат?",
    ru: "С какой страной разделяют Алайские и Туркестанские хребты Кыргызскую Республику?",
    optionsKg: ["Өзбекстан", "Тажикстан", "Казакстан", "Кытай"],
    optionsRu: ["Узбекистан", "Таджикистан", "Казахстан", "Китай"],
    correctIndex: 1
  },
  {
    number: 5,
    kg: "КРсынын эң көтөрүӊкү бөлүгү болуп?",
    ru: "Наиболее приподнятой частью КР является?",
    optionsKg: ["Батыш Тянь-Шань", "Борбордук Тянь-Шань", "Түштүк Тянь-Шань", "Чыгыш Тянь-Шань"],
    optionsRu: ["Западный Тянь-Шань", "Центральный Тянь-Шань", "Южный Тянь-Шань", "Восточный Тянь-Шань"],
    correctIndex: 1
  },
  {
    number: 6,
    kg: "КРсынын тоолорунун эң талкаланган бөлүгү?",
    ru: "Наиболее разрушенной частью гор КР является?",
    optionsKg: ["Түштүк Тянь-Шань", "Ички Тянь-Шань", "Түндүк Тянь-Шань", "Борбордук Тянь-Шань"],
    optionsRu: ["Южный Тянь-Шань", "Внутренний Тянь-Шань", "Северный Тянь-Шань", "Центральный Тянь-Шань"],
    correctIndex: 0
  },
  {
    number: 7,
    kg: "КРсынын эң бийик жерин атагыла?",
    ru: "Наивысшая абсолютная точка в КР считается?",
    optionsKg: ["Ленин", "Аламедин", "Чок-Тал", "Жеңиш"],
    optionsRu: ["пик Ленина", "пик Аламедин", "пик Чок-Тал", "пик Победы"],
    correctIndex: 3
  },
  {
    number: 8,
    kg: "Кыргызстандын абсолюттук бийиктиги эӊ төмөн жерин атагыла?",
    ru: "Наименьшая высота Кыргызстана над уровнем моря?",
    optionsKg: ["Чүй дарыясынын нугу", "Талас өрөөнү", "Кулунду", "Тар дарыясынын чаты"],
    optionsRu: ["русло р. Чу", "Талаская долина", "Кулунду", "устье р. Тар"],
    correctIndex: 2
  },
  {
    number: 9,
    kg: "КРдагы эң узун тоо кыркасы?",
    ru: "Самый длинный хребет в КР?",
    optionsKg: ["Какшаал-Тоо", "Фергана", "Күнгөй Ала-Тоо", "Талас Ала-Тоосу"],
    optionsRu: ["Какшаал-Тоо", "Ферганский", "Кунгей Ала-Тоо", "Талаский"],
    correctIndex: 0
  },
  {
    number: 10,
    kg: "КРдагы эң төмөн өрөөн?",
    ru: "Наиболее низкая долина в КР?",
    optionsKg: ["Фергана", "Чаткал", "Тогуз-Торо", "Алай"],
    optionsRu: ["Ферганская", "Чаткальская", "Тогуз-Тороуская", "Алайская"],
    correctIndex: 0
  },
  {
    number: 11,
    kg: "КРсындагы ири ачык өрөөн?",
    ru: "Крупной открытой долиной в КР считается?",
    optionsKg: ["Талас", "Чүй", "Кочкор", "Ат-Башы"],
    optionsRu: ["Талаская", "Чуйская", "Кочкорская", "Ат-Башинская"],
    correctIndex: 1
  },
  {
    number: 12,
    kg: "Кыргыз Ала-Тоосунун эң бийик точкасы?",
    ru: "Наивысшая точка Кыргызского хребта?",
    optionsKg: ["Путин пиги", "Манас пиги", "Аламүдүн пиги", "Кара-Балта пиги"],
    optionsRu: ["пик Путина", "пик Манаса", "пик Аламедин", "пик Кара-Балта"],
    correctIndex: 2
  },
  {
    number: 13,
    kg: "КРсындагы эң бийик тоолуу өрөөн?",
    ru: "Самой высокогорной долиной в КР считается?",
    optionsKg: ["Ак-Сай", "Баткен", "Соң-Көл", "Телес"],
    optionsRu: ["Ак-Сайская", "Баткенская", "Сон-Кульская", "Телеская"],
    correctIndex: 0
  },
  {
    number: 14,
    kg: "КРсында кайсы тоо кыркасы туурасынан жайгашкан?",
    ru: "Какой горный хребет располагается почти поперек в КР?",
    optionsKg: ["Сандык тоо кыркасы", "Байбиче-Тоо", "Кара-Тоо", "Фергана"],
    optionsRu: ["хребет Сандык", "Байбиче-Тоо", "Кара-Тоо", "Ферганский"],
    correctIndex: 3
  },
  {
    number: 15,
    kg: "КРсындагы ири жабык ойдуң?",
    ru: "Крупной закрытой впадиной в КР считается?",
    optionsKg: ["Ысык-Көл", "Тогуз-Торо", "Чоң-Кемин", "Кара-Кужур"],
    optionsRu: ["Иссык-Кульская", "Тогуз-Тороуская", "Чоң-Кеминская", "Кара Куджур"],
    correctIndex: 0
  },
  {
    number: 16,
    kg: "КРсында өрөөндөр абсолюттук бийиктиги боюнча канчага бөлүнөт?",
    ru: "По абсолютной высоте долины в КР подразделяются?",
    optionsKg: ["6 типке", "3 типке", "8 типке", "2 типке"],
    optionsRu: ["на 6 типов", "на 3 типа", "на 8 типов", "на 2 типа"],
    correctIndex: 1
  },
  {
    number: 17,
    kg: "Кыргыз Республикасы менен Кытай менен чек арасы кайсы кырка тоо аркылуу өтөт?",
    ru: "По какому горному хребту проходит граница Кыргызской Республики с Китаем?",
    optionsKg: ["Фергана кырка тоо", "Талас Ала-Тоо", "Какшаал-Тоо", "Чаткал кырка тоо", "Молдо-Тоо"],
    optionsRu: ["Ферганские хребты", "Таласские Ала-Тоо", "Какшаалские горы", "Чаткальские хребты", "Молдо-Тоо"],
    correctIndex: 2
  },
  {
    number: 18,
    kg: "КРсындагы өрөөндөр кандай пайда болгон?",
    ru: "Какого происхождения долины в КР?",
    optionsKg: ["деңиздик", "тектоникалык", "кораллдык", "шиленди"],
    optionsRu: ["морского", "тектонического", "кораллового", "завального"],
    correctIndex: 1
  },
  {
    number: 19,
    kg: "КРсынын тоолору бийиктиги боюнча канча типке бөлүнгөн?",
    ru: "На какие типы по высоте делятся горы в КР?",
    optionsKg: ["2 типке", "16 типке", "3 типке", "1 типке"],
    optionsRu: ["на 2 типа", "на 16 типов", "на 3 типа", "на 1 тип"],
    correctIndex: 2
  },
  {
    number: 20,
    kg: "Рельефтин адырдык формасы кайсы жерлерде жайгашкан?",
    ru: "Где располагаются адырные формы рельефа?",
    optionsKg: ["бийик тоолордо", "тоо этектеринде", "өрөөндөрдө", "дарыялардын нугунда"],
    optionsRu: ["в высокогорье", "в подошвах хребтов", "в долине", "в руслах рек"],
    correctIndex: 1
  },
  {
    number: 21,
    kg: "Кыргызстанда орточо бийиктик (абсолюттук) канчага барабар?",
    ru: "Чему равна средняя высота (абс.) в Кыргызстане?",
    optionsKg: ["500 м", "1000 м", "8000 м", "2500 м"],
    optionsRu: ["500 м", "1000 м", "8000 м", "2500 м"],
    correctIndex: 3
  },
  {
    number: 22,
    kg: "Кыргыз Республикасынын түндүгүнөн түштүгүнө чейинки аралык",
    ru: "Протяженность Кыргызской Республики с севера на юг",
    optionsKg: ["300 км", "410 км", "459 км", "640 км"],
    optionsRu: ["300 км", "410 км", "459 км", "640 км"],
    correctIndex: 2
  },
  {
    number: 23,
    kg: "Кыргызстанда кайсы өрөөн өтмө деп эсептелет?",
    ru: "Какая впадина в Кыргызстане считается сквозной?",
    optionsKg: ["Талас", "Чүй", "Тогуз-Торо", "Фергана"],
    optionsRu: ["Талаская", "Чуйская", "Тогуз-Тороуская", "Ферганская"],
    correctIndex: 2
  },
  {
    number: 24,
    kg: "Чүй жана Ысык-Көл ойдуңун кайсы капчыгай бириктирип турат?",
    ru: "Какое ущелье соединяет Чуйскую и Иссык-Кульскую впадины?",
    optionsKg: ["Боом", "Долон", "Чычкан", "Кызыл-Бел"],
    optionsRu: ["Боомская", "Долонская", "Чычкан", "Кызыл-Бельская"],
    correctIndex: 0
  },
  {
    number: 25,
    kg: "Чоң Алай (Заалай) тоо кыркасы кайсы тоо системасына кирет?",
    ru: "К какой горной системе относится Заалайский хребет?",
    optionsKg: ["Тянь-Шань", "Памир-Алай", "Казах", "Непаль"],
    optionsRu: ["Тянь-Шанской", "Памиро-Алайской", "Казахской", "Непальской"],
    correctIndex: 1
  },
  {
    number: 26,
    kg: "Ысык-Көл ойдуңунун (батыштан чыгышка чейинки) узундугу канча?",
    ru: "Какова длина (с запада на восток) Иссык-Кульской котловины?",
    optionsKg: ["500 км", "350 км", "150 км", "250 км"],
    optionsRu: ["500 км", "350 км", "150 км", "250 км"],
    correctIndex: 3
  },
  {
    number: 27,
    kg: "КРсында тоо кыркалары канча пайыз аймакты ээлейт?",
    ru: "Сколько процентов территории КР занимают горные хребты?",
    optionsKg: ["20 %", "40 %", "90 %", "65 %"],
    optionsRu: ["20 %", "40 %", "90 %", "65 %"],
    correctIndex: 3
  },
  {
    number: 28,
    kg: "Кыргызстан канча орографиялык районго бөлүнөт?",
    ru: "На сколько орографических районов делят Кыргызстан?",
    optionsKg: ["2 районго", "8 районго", "6 районго", "бөлүнбөйт"],
    optionsRu: ["2 района", "8 районов", "6 районов", "не делят"],
    correctIndex: 2
  },
  {
    number: 29,
    kg: "Кыргызстанда өндүрүлгөн кайсы металл электротехникада, медицинада, тоо-кен ишинде кеӊири колдонулат?",
    ru: "Какой металл, добывемый в Кыргызстане, широко применяется в электротехнике, медицине, в горном деле?",
    optionsKg: ["сымап", "калай", "темир", "цинк"],
    optionsRu: ["ртуть", "олово", "железо", "цинк"],
    correctIndex: 0
  },
  {
    number: 30,
    kg: "Кыргыз Республикасынын эң бийик жери канча метр бийиктикте?",
    ru: "На какой высоте самое высокое место в Кыргызской Республике?",
    optionsKg: ["7439 м", "8940 м", "6009 м", "2900 м", "10920 м"],
    optionsRu: ["7439 м", "8940 м", "6009 м", "2900 м", "10920 м"],
    correctIndex: 0
  },
  {
    number: 31,
    kg: "Фергана кырка тоосунун орто жана бийик тилкелеринде кардын орточо калыӊдыгы канчага барабар?",
    ru: "Сколько см снежного покрова образуется в средних и высокогорных поясах Ферганского хребта?",
    optionsKg: ["100 см", "130 см", "200 см", "150 см"],
    optionsRu: ["100 см", "130 см", "200 см", "150 см"],
    correctIndex: 3
  },
  {
    number: 32,
    kg: "Кыргыз Республикасынын батышынан чыгышына чейинки аралык",
    ru: "Протяженность Кыргызской Республики с запада на восток",
    optionsKg: ["300 км", "410 км", "459 км", "925 км"],
    optionsRu: ["300 км", "410 км", "459 км", "925 км"],
    correctIndex: 3
  },
  {
    number: 33,
    kg: "Жаан-чачындын көбөйүүсү кайсыл бийиктике чейин уланат?",
    ru: "До какой высоты продолжается увеличение осадков?",
    optionsKg: ["3700 м", "3800 м", "4000 м", "4300 м"],
    optionsRu: ["3700 м", "3800 м", "4000 м", "4100 м"],
    correctIndex: 2
  },
  {
    number: 34,
    kg: "Кыргызстанда кайсыл айлар эң жылуу болуп саналат:",
    ru: "Какие месяцы в Кыргызстане являются наиболее теплыми:",
    optionsKg: ["июнь жана июль", "июль жана август", "август жана сентябрь", "май жана июнь"],
    optionsRu: ["июнь и июль", "июль и август", "август и сентябрь", "май и июнь"],
    correctIndex: 1
  },
  {
    number: 35,
    kg: "Кыргыз Республикасынын аймагы канчанчы сааттык алкактан орун алган?",
    ru: "Территория Кыргызской Республики на каком часовом поясе находятся?",
    optionsKg: ["7", "8", "5", "1"],
    optionsRu: ["7", "8", "5", "1"],
    correctIndex: 2
  },
  {
    number: 36,
    kg: "Балыкчы шаарында жаан-чачындын жылдык өлчөмү канча?",
    ru: "Сколько осадков выпадает в г. Балыкчы?",
    optionsKg: ["100 мм", "120 мм", "130 мм", "115 мм"],
    optionsRu: ["100 мм", "120 мм", "130 мм", "115 мм"],
    correctIndex: 3
  },
  {
    number: 37,
    kg: "Кыргыз Ала-Тоо кыркасынын түндүк капталында мөңгүлөрдүн саны канча?",
    ru: "Сколько ледников имеется на северном склоне хребта Кыргызского Ала-Тоо?",
    optionsKg: ["40", "500", "600", "453"],
    optionsRu: ["40", "500", "600", "453"],
    correctIndex: 3
  },
  {
    number: 38,
    kg: "Чүй дарыясынын оң куймасы болуп кайсы дарыя саналат?",
    ru: "Какие реки являются правыми притоками р. Чу?",
    optionsKg: ["Чон Кемин жана Кичи Кемин", "Кара-Балта", "Ала-Арча", "Аламүдүн"],
    optionsRu: ["Чон Кемин и Кичи Кемин", "Кара-Балта", "Ала-Арча", "Аламудюн"],
    correctIndex: 0
  },
  {
    number: 39,
    kg: "Чоң-Кемин дарыясынын алабына таандык канча мөңгү бар?",
    ru: "Сколько ледников в бассейне реки Чон-Кемин?",
    optionsKg: ["177 ледников", "180 ледников", "150 ледников", "200 ледников"],
    optionsRu: ["177 ледников", "180 ледников", "150 ледников", "200 ледников"],
    correctIndex: 0
  },
  {
    number: 40,
    kg: "Түркестан тоо кыркасынын жалпы узундугу канча км түзөт?",
    ru: "Сколько км составляет общая длина Туркестанского хребта?",
    optionsKg: ["360 км", "400 км", "500 км", "320 км"],
    optionsRu: ["360 км", "400 км", "500 км", "320 км"],
    correctIndex: 3
  }
];

const letters = ["A", "B", "C", "D", "E"];

function updateLanguageButtons() {
  ui.langRu.classList.toggle("chip--active", state.lang === "ru");
  ui.langKg.classList.toggle("chip--active", state.lang === "kg");
}

function getQuestionText(question) {
  return state.lang === "ru" ? question.ru : question.kg;
}

function getQuestionOptions(question) {
  return state.lang === "ru" ? question.optionsRu : question.optionsKg;
}

function renderQuestion() {
  const question = questions[state.currentIndex];
  const options = getQuestionOptions(question);
  const key = String(question.number);

  ui.quizCard.classList.remove("hidden");
  ui.resultCard.classList.add("hidden");
  ui.questionCounter.textContent = `${state.currentIndex + 1} / ${questions.length}`;
  ui.questionNumberBadge.textContent = `Вопрос №${question.number}`;
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

  ui.statusBanner.textContent = state.lang === "ru"
    ? "Выбирай один вариант ответа и переходи дальше."
    : "Бир жоопту тандап, кийинки суроого өт.";
}

function updateProgress() {
  const answered = Object.keys(state.answers).length;
  const total = questions.length;
  const percent = Math.round((answered / total) * 100);
  ui.progressText.textContent = `${answered} из ${total} отвечено`;
  ui.progressBar.style.width = `${percent}%`;
}

function startQuiz() {
  state.started = true;
  state.currentIndex = 0;
  renderQuestion();
  updateProgress();
}

function showResults() {
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.remove("hidden");
  ui.resultBody.innerHTML = "";

  let correctCount = 0;

  questions.forEach((question) => {
    const options = getQuestionOptions(question);
    const answerIndex = state.answers[String(question.number)];
    const correctIndex = question.correctIndex;
    const exactCorrectText = state.lang === "ru" ? question.exactCorrectRu : question.exactCorrectKg;
    const answerText = answerIndex === undefined
      ? (state.lang === "ru" ? "Нет ответа" : "Жооп жок")
      : `${letters[answerIndex]}. ${options[answerIndex]}`;
    const correctText = exactCorrectText
      ? exactCorrectText
      : correctIndex === undefined
        ? (state.lang === "ru" ? "Ключ не задан" : "Туура жооп берилген эмес")
        : `${letters[correctIndex]}. ${options[correctIndex]}`;

    if (exactCorrectText) {
      if (correctIndex !== undefined && answerIndex !== undefined && answerIndex === correctIndex) {
        correctCount += 1;
      }
    } else if (answerIndex !== undefined && answerIndex === correctIndex) {
      correctCount += 1;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${question.number}</td>
      <td>${getQuestionText(question)}</td>
      <td>${answerText}</td>
      <td>${correctText}</td>
    `;
    ui.resultBody.appendChild(row);
  });

  const answered = Object.keys(state.answers).length;
  ui.resultSummary.textContent = state.lang === "ru"
    ? `Ты ответил на ${answered} из ${questions.length} вопросов. Правильно: ${correctCount}.`
    : `Сен ${questions.length} суроонун ${answered} суроосуна жооп бердиң. Туурасы: ${correctCount}.`;

  ui.statusBanner.textContent = state.lang === "ru"
    ? "Ниже показаны твои ответы и правильные варианты."
    : "Төмөндө сенин жоопторуң жана туура варианттар көрсөтүлдү.";
}

function resetQuiz() {
  state.started = false;
  state.currentIndex = 0;
  state.answers = {};
  ui.quizCard.classList.add("hidden");
  ui.resultCard.classList.add("hidden");
  ui.statusBanner.textContent = state.lang === "ru"
    ? "Нажми «Начать тест», чтобы загрузить вопросы."
    : "Суроолорду ачуу үчүн «Тестти баштоо» баскычын бас.";
  updateProgress();
}

ui.langRu.addEventListener("click", () => {
  state.lang = "ru";
  updateLanguageButtons();
  if (state.started) {
    if (!ui.resultCard.classList.contains("hidden")) {
      showResults();
    } else {
      renderQuestion();
    }
  } else {
    resetQuiz();
  }
});

ui.langKg.addEventListener("click", () => {
  state.lang = "kg";
  updateLanguageButtons();
  if (state.started) {
    if (!ui.resultCard.classList.contains("hidden")) {
      showResults();
    } else {
      renderQuestion();
    }
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

updateLanguageButtons();
updateProgress();
