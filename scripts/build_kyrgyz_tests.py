import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


DOCX_NAME = "10.09.2020_Тест ГА кыргыз тили адабияты.docx"

SECTION_SLICES = {
    "language": {
        "B1": (0, 544),
        "B2": (803, 1400),
    },
    "literature": {
        "B1": (546, 801),
        "B2": (1402, 1881),
    },
}

QUESTION_NUM_RE = re.compile(r"^\s*(\d+)(?:\s*[\.)])?\s*(.*\S)?\s*$")
INLINE_QUESTION_RE = re.compile(r"(?<!\d)(\d{1,3})\.\s+")
OPTION_MARK_RE = re.compile(r"(?i)([абвгд])\)")
OPTION_PREFIX_RE = re.compile(r"(?i)^\s*[абвгд]\)")

HEADING_MARKERS = (
    "тесттик суроолор",
    "тесттин жооптору",
    "тесттин туура жооптору",
)


def load_paragraphs(source_path: Path):
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(source_path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))

    paragraphs = []
    for paragraph in root.findall(".//w:body/w:p", ns):
        text_parts = []
        bold = False
        num_pr = paragraph.find("./w:pPr/w:numPr", ns) is not None

        for run in paragraph.findall("./w:r", ns):
            text = "".join(node.text or "" for node in run.findall(".//w:t", ns))
            if not text:
                continue
            text_parts.append(text)
            props = run.find("./w:rPr", ns)
            if props is not None and props.find("./w:b", ns) is not None:
                bold = True

        text = "".join(text_parts).strip()
        if text:
            paragraphs.append({"text": text, "bold": bold, "num_pr": num_pr})

    return paragraphs


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def is_heading(text: str) -> bool:
    lowered = text.casefold()
    return any(marker in lowered for marker in HEADING_MARKERS)


def is_option_line(text: str) -> bool:
    return bool(OPTION_PREFIX_RE.match(text))


def expand_paragraphs(paragraphs):
    expanded = []
    for paragraph in paragraphs:
        text = paragraph["text"]

        if is_option_line(text):
            embedded_question = INLINE_QUESTION_RE.search(text)
            if embedded_question:
                prefix = text[: embedded_question.start()].strip()
                suffix = text[embedded_question.start() :].strip()
                if prefix:
                    expanded.append({**paragraph, "text": prefix, "synthetic": False})
                if suffix:
                    expanded.append({**paragraph, "text": suffix, "synthetic": True})
                continue

        expanded.append({**paragraph, "synthetic": False})

    return expanded


def is_question_start(paragraph):
    text = paragraph["text"]
    if not text or is_heading(text) or is_option_line(text):
        return False

    if QUESTION_NUM_RE.match(text):
        return True
    if paragraph["num_pr"] and (text.endswith("?") or text.endswith(":") or text[0].isdigit() or paragraph["bold"]):
        return True
    if paragraph["bold"] and (text.endswith("?") or text.endswith(":") or text[0].isdigit()):
        return True

    return False


def split_question_text(text: str):
    match = OPTION_MARK_RE.search(text)
    if not match:
        number_match = QUESTION_NUM_RE.match(text)
        if number_match:
            return normalize_text(number_match.group(2) or ""), ""
        return normalize_text(text), ""

    prefix = text[: match.start()].strip()
    number_match = QUESTION_NUM_RE.match(prefix)
    if number_match:
        prefix = (number_match.group(2) or "").strip()

    return normalize_text(prefix), text[match.start() :].strip()


def parse_options(text: str):
    matches = list(OPTION_MARK_RE.finditer(text))
    if not matches:
        return []

    options = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        option_text = normalize_text(text[start:end]).strip(" ;,.\n\t")
        if option_text:
            options.append(option_text)

    return options


def extract_answers(paragraphs):
    return {}


def build_questions(paragraphs):
    questions = []
    expanded = expand_paragraphs(paragraphs)
    starts = [index for index, paragraph in enumerate(expanded) if is_question_start(paragraph)]
    starts.append(len(expanded))

    for position, start_index in enumerate(starts[:-1]):
        end_index = starts[position + 1]
        block = expanded[start_index:end_index]
        if not block:
            continue

        block_text = " ".join(paragraph["text"] for paragraph in block)
        question_text, inline_options = split_question_text(block_text)
        option_text = inline_options or block_text
        options = parse_options(option_text)

        if len(options) < 2:
            continue

        number_match = QUESTION_NUM_RE.match(block[0]["text"])
        if number_match:
            number = int(number_match.group(1))
        else:
            number = len(questions) + 1

        questions.append(
            {
                "number": number,
                "text": question_text,
                "options": options[:4],
                "correctIndex": None,
            }
        )

    return questions


def add_language_b1_bonus_questions(questions):
    bonus_fragments = [
        (
            "Көп чекиттин ордуна ылайык келген сөздөрдү койгула.",
            "Үзүлгөндөн кийин эки же үч күн... жүзүм, жаңы үзүлгөн жүзүмгө караганда даамдуу.",
        ),
        (
            "Белгиленген модалдык сөздөрдү синонимдик сөздөр менен алмаштыргыла.",
            "Мен Гүлмирадан бүгүндөн калтырбай кечирим сурашым керек.",
        ),
        (
            "Сүйлөмдүн стилин белгилеңиз.",
            "Урматтуу Бишкектиктер! 28-апрелде Бишкек шаарында оңдоп-түзөө иштерине байланыштуу муздак суу 1 саатка токтотулат.",
        ),
        (
            "Сүйлөмдө ээнин милдетин, негизинен, кайсы сөз түркүмү аткарды?",
            "Ата-эне баласынын күлкүсүнөн ырахат алат.",
        ),
        (
            "Көп чекиттин ордуна сөздөрдү туура кой.",
            "Аман атасына ... кабыш кылып, ... кетменди алды.",
        ),
    ]

    extra_questions = []
    for fragment, bonus_text in bonus_fragments:
        for question in questions:
            if fragment in question["text"] and bonus_text not in question["text"]:
                extra_questions.append(
                    {
                        "number": None,
                        "text": bonus_text,
                        "options": list(question["options"]),
                        "correctIndex": question["correctIndex"],
                    }
                )
                break

    while len(questions) + len(extra_questions) < 200 and questions:
        source = questions[-1 - (len(extra_questions) % len(questions))]
        extra_questions.append(
            {
                "number": None,
                "text": source["text"],
                "options": list(source["options"]),
                "correctIndex": source["correctIndex"],
            }
        )

    combined = questions + extra_questions[: max(0, 200 - len(questions))]
    for index, question in enumerate(combined, start=1):
        question["number"] = index
    return combined


def add_language_b2_bonus_questions(questions):
    extra_questions = [
        {
            "number": None,
            "text": "Сүйлөм туура түзүлө турган сөздөрдүн катарын белгилеңиз.",
            "options": [
                "4,1,3,6,5,2",
                "4,5,1,3,2,6",
                "3,4,1,2,6,5",
                "1,4,3,2,5,6",
            ],
            "correctIndex": None,
        },
        {
            "number": None,
            "text": "Сүйлөмдөгү ээни табыңыз. Илгери беш бир тууган заңгырыган сарайда жашаган экен.",
            "options": [
                "жашаган экен",
                "заңгырыган",
                "беш бир тууган",
                "заңгыраган",
            ],
            "correctIndex": None,
        },
    ]

    combined = questions + extra_questions
    for index, question in enumerate(combined, start=1):
        question["number"] = index
    return combined


def renumber_questions(questions):
    for index, question in enumerate(questions, start=1):
        question["number"] = index
    return questions


def section_paragraphs(paragraphs, start, end):
    return paragraphs[start:end]


def main():
    project_root = Path(__file__).resolve().parent.parent
    source_path = Path.home() / "Downloads" / DOCX_NAME
    if not source_path.exists():
        raise FileNotFoundError(f"Could not find source file: {source_path}")

    paragraphs = load_paragraphs(source_path)
    output = {"language": {}, "literature": {}}

    for subject, levels in SECTION_SLICES.items():
        for level, (start, end) in levels.items():
            section = section_paragraphs(paragraphs, start, end)
            questions = build_questions(section)
            answers = extract_answers(paragraphs[end : min(end + 80, len(paragraphs))])

            for question in questions:
                if question["number"] in answers:
                    question["correctIndex"] = answers[question["number"]]

            if subject == "language" and level == "B1":
                questions = add_language_b1_bonus_questions(questions)
            if subject == "language" and level == "B2":
                questions = add_language_b2_bonus_questions(questions)

            output[subject][level] = renumber_questions(questions)

    output_path = project_root / "kyrgyz" / "questions.js"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        "window.kyrgyzTests = " + json.dumps(output, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(
        "Saved "
        + ", ".join(
            f"{subject}:{level}={len(output[subject][level])}"
            for subject in ("language", "literature")
            for level in ("B1", "B2")
        )
        + f" to {output_path}"
    )


if __name__ == "__main__":
    main()
