import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


QUESTION_RE = re.compile(r"^\s*(\d+)(?:\s*[\.)])?\s+(.*\S)?\s*$")
OPTION_MARK_RE = re.compile(r"(?u)(?<!\w).\s*\)")


def load_paragraphs(source_path: Path):
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(source_path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))

    paragraphs = []
    for para in root.findall(".//w:body/w:p", ns):
        runs = []
        for run in para.findall("w:r", ns):
            text = "".join(node.text or "" for node in run.findall(".//w:t", ns))
            if text:
                runs.append((text, ""))

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
    for para in paragraphs:
        for text, _ in para["runs"]:
            chars.extend(text)
        chars.append("\n")

    flat_text = "".join(chars)
    matches = list(OPTION_MARK_RE.finditer(flat_text))

    options = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(flat_text)
        option = re.sub(r"\s+", " ", flat_text[start:end]).strip(" ;,.\n\t")
        options.append(option)

    return options


def build_questions(paragraphs):
    questions = []
    seen_numbers = set()
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

        if number not in seen_numbers:
            questions.append(
                {
                    "number": number,
                    "kg": question_kg,
                    "ru": question_ru or question_kg,
                    "optionsKg": parse_options(kg_option_paragraphs),
                    "optionsRu": parse_options(ru_option_paragraphs) or parse_options(kg_option_paragraphs),
                    "correctIndex": None,
                }
            )
            seen_numbers.add(number)

    return questions


def load_known_answers(output_path: Path):
    if not output_path.exists():
        return {}

    data = output_path.read_text(encoding="utf-8-sig")
    data = re.sub(r"^window\.questionsData = ", "", data)
    data = re.sub(r";\s*$", "", data)
    parsed = json.loads(data)
    return {
        item["number"]: item["correctIndex"]
        for item in parsed
        if item.get("correctIndex") is not None
    }


def main():
    project_root = Path(__file__).resolve().parent.parent
    source_path = project_root / "answers_source.docx"
    output_path = project_root / "questions.js"

    paragraphs = load_paragraphs(source_path)
    questions = build_questions(paragraphs)
    if len(questions) != 180:
        raise RuntimeError(f"Expected 180 questions, found {len(questions)}")

    known_answers = load_known_answers(output_path)
    for question in questions:
        question["correctIndex"] = known_answers.get(question["number"])

    payload = "window.questionsData = " + json.dumps(questions, ensure_ascii=False, indent=4) + ";\n"
    output_path.write_text(payload, encoding="utf-8")
    missing = [question["number"] for question in questions if question["correctIndex"] is None]
    print(f"Saved {len(questions)} questions to {output_path}")
    print(f"Questions without answer key: {len(missing)}")


if __name__ == "__main__":
    main()
