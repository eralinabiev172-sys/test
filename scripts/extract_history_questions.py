import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


QUESTION_RE = re.compile(r"^\s*(\d+)(?:\s*[\.)])?\s+(.*\S)?\s*$")
OPTION_MARK_RE = re.compile(r"(?u)(?<!\w).\s*\)")
RED = {"FF0000"}
MANUAL_CORRECT = {118: 1}


def load_paragraphs(source_path: Path):
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(source_path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))

    paragraphs = []
    for para in root.findall(".//w:body/w:p", ns):
        runs = []
        for run in para.findall("w:r", ns):
            text = "".join(node.text or "" for node in run.findall(".//w:t", ns))
            if not text:
                continue

            color = ""
            props = run.find("w:rPr", ns)
            if props is not None:
                color_node = props.find("w:color", ns)
                if color_node is not None:
                    color = color_node.attrib.get(f"{{{ns['w']}}}val", "")

            runs.append((text, color.upper()))

        full_text = "".join(text for text, _ in runs).strip()
        if full_text:
            paragraphs.append({"runs": runs, "text": full_text})

    return paragraphs


def has_option_marker(text: str) -> bool:
    return OPTION_MARK_RE.search(text) is not None


def split_question_paragraph(text: str):
    match = QUESTION_RE.match(text)
    number = int(match.group(1))
    body = (match.group(2) or "").strip()
    option_match = OPTION_MARK_RE.search(body)
    if option_match:
        return number, body[:option_match.start()].strip(), body[option_match.start():].strip()
    return number, body, None


def synthetic_paragraph(text: str):
    return {"text": text, "runs": [(text, "")]}


def parse_options(paragraphs):
    chars = []
    red_flags = []

    for para in paragraphs:
        for text, color in para["runs"]:
            for char in text:
                chars.append(char)
                red_flags.append(color in RED)
        chars.append("\n")
        red_flags.append(False)

    flat_text = "".join(chars)
    matches = list(OPTION_MARK_RE.finditer(flat_text))

    option_texts = []
    correct_index = None

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(flat_text)
        text = re.sub(r"\s+", " ", flat_text[start:end]).strip(" ;,.\n\t")
        option_texts.append(text)

        if any(red_flags[pos] for pos in range(match.start(), end)):
            correct_index = index

    return option_texts, correct_index


def build_questions(paragraphs):
    questions = []
    index = 0

    while index < len(paragraphs):
        current = paragraphs[index]
        if not QUESTION_RE.match(current["text"]):
            index += 1
            continue

        number, question_kg, inline_kg_options = split_question_paragraph(current["text"])
        index += 1

        kg_option_paragraphs = [synthetic_paragraph(inline_kg_options)] if inline_kg_options else []
        while index < len(paragraphs):
            if QUESTION_RE.match(paragraphs[index]["text"]):
                break

            if has_option_marker(paragraphs[index]["text"]):
                kg_option_paragraphs.append(paragraphs[index])
                index += 1
                continue

            if kg_option_paragraphs:
                break

            question_kg = f"{question_kg} {paragraphs[index]['text']}".strip()
            index += 1

        question_ru = ""
        ru_option_paragraphs = []

        if index < len(paragraphs) and QUESTION_RE.match(paragraphs[index]["text"]):
            ru_number, question_ru, inline_ru_options = split_question_paragraph(paragraphs[index]["text"])
            if ru_number == number:
                index += 1

                if inline_ru_options:
                    ru_option_paragraphs.append(synthetic_paragraph(inline_ru_options))

                while index < len(paragraphs):
                    if QUESTION_RE.match(paragraphs[index]["text"]):
                        break

                    if has_option_marker(paragraphs[index]["text"]):
                        ru_option_paragraphs.append(paragraphs[index])
                        index += 1
                        continue

                    if ru_option_paragraphs:
                        break

                    question_ru = f"{question_ru} {paragraphs[index]['text']}".strip()
                    index += 1
            else:
                question_ru = ""

        options_kg, correct_kg = parse_options(kg_option_paragraphs)
        options_ru, correct_ru = parse_options(ru_option_paragraphs)
        correct_index = MANUAL_CORRECT.get(number, correct_ru if correct_ru is not None else correct_kg)

        questions.append(
            {
                "number": number,
                "kg": question_kg,
                "ru": question_ru or question_kg,
                "optionsKg": options_kg,
                "optionsRu": options_ru or options_kg,
                "correctIndex": correct_index,
            }
        )

    return questions


def main():
    project_root = Path(__file__).resolve().parent.parent
    source_path = Path(sys.argv[1]) if len(sys.argv) > 1 else project_root / "history_source.docx"
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else project_root / "тест про исторю" / "questions.js"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    paragraphs = load_paragraphs(source_path)
    questions = build_questions(paragraphs)

    if len(questions) != 200:
        raise RuntimeError(f"Expected 200 questions, found {len(questions)}")

    broken = [
        question["number"]
        for question in questions
        if question["correctIndex"] is None
        or len(question["optionsKg"]) < 2
        or len(question["optionsKg"]) != len(question["optionsRu"])
    ]
    if broken:
        raise RuntimeError(f"Invalid parsed questions: {broken}")

    payload = "window.questionsData = " + json.dumps(questions, ensure_ascii=False, indent=2) + ";\n"
    output_path.write_text(payload, encoding="utf-8")
    print(f"Saved {len(questions)} questions to {output_path}")


if __name__ == "__main__":
    main()



