import json
import re
import sys
import zlib
from pathlib import Path


QUESTION_RE = re.compile(r"^\s*(\d+)(?:\s*[\.)])?\s*(.*\S)?\s*$")
OPTION_MARK_RE = re.compile(r"(?u)(?<!\w).\s*\)")
RED = {"FF0000"}
MANUAL_CORRECT = {118: 1}

QUESTION_OVERRIDES = {
    17: {
        "kg": "Кыргыз саясий лидерлеринин кайсынысы XVIII кылымдын 2 - жарымында Ирдана бий менен дипломатиялык мамиле түзүп, Анжиянга жакын жерде эгемендүү кеңири аймакты түзө алган .",
        "ru": "Кто из кыргызских политических лидеров во второй половине XVIII века разорвал дипломатические отношение с Ирдана биям и создал обширную, самостоятельную область в окрестностях Андижана.",
        "optionsKg": ["Акбото бий", "Маматкул бий", "Кубат бий", "Нүзүп бий"],
        "optionsRu": ["Акбото бий", "Маматкул бий", "Кубат бий", "Нузуп бий"],
        "correctIndexKg": 2,
        "correctIndexRu": 2,
        "correctIndex": 2,
    },
    30: {
        "kg": "Чуст маданиятындагы уруулардын негизги иши эмне ?",
        "ru": "Основное занятие племён чустской культуры?",
        "optionsKg": ["дыйканчылык", "мал чарбасы", "кол өнөрчүлүк", "билим берүү"],
        "optionsRu": ["земледелие", "скотоводство", "искусство", "образование"],
        "correctIndexKg": 0,
        "correctIndexRu": 0,
        "correctIndex": 0,
    },
    44: {
        "kg": "Эл аралык террористтер Кыргызстанга кайсы жылы басып кирген?",
        "ru": "В каком году международные террористы вторглись в Кыргызстан?",
        "optionsKg": ["1998 - ж", "1999 - ж", "2001 - ж", "2002 - ж"],
        "optionsRu": ["1998 г", "1999 г", "2001 г", "2002 г"],
        "correctIndexKg": 1,
        "correctIndexRu": 1,
        "correctIndex": 1,
    },
    49: {
        "kg": "Улуттук валюта сом кайсы жылы жүгүртүүгө киргизилген?",
        "ru": "В каком году была введена национальная валюта сом?",
        "optionsKg": ["1991 - ж", "1992 - ж", "1993 - ж", "1995 - ж"],
        "optionsRu": ["1991 г", "1992 г", "1993 г", "1995 г"],
        "correctIndexKg": 2,
        "correctIndexRu": 2,
        "correctIndex": 2,
    },
    69: {
        "kg": "Түрк этноними кайсы жылы эскерилген?",
        "ru": "В каком году упоминается этноним тюрк?",
        "optionsKg": ["540 - ж", "545 - ж", "546 - ж", "548 - ж"],
        "optionsRu": ["540 г", "545 г", "546 г", "548 г"],
        "correctIndexKg": 2,
        "correctIndexRu": 2,
        "correctIndex": 2,
    },
    75: {
        "kg": "Назовите панфиловца в честь которого назван город в Кыргызстане?",
        "ru": "Дайыр Асанов Улуу Ата Мекендик согушта, кайсы шаар үчүн болгон күрөштө атактуу болгон?",
        "optionsKg": ["Шопоков", "Кант", "Каракол", "Токтогул"],
        "optionsRu": ["Москва", "Сталинград", "Курск", "Берлин"],
        "correctIndexKg": 0,
        "correctIndexRu": 1,
        "correctIndex": 0,
    },
    172: {
        "kg": "“Жайылдын кыргыны” качан жана кыргыздар кимдер менен согушканда болгон?",
        "ru": "В каком году произошло «Побоище Жайыла» и с кем воевали кыргызы?",
        "optionsKg": ["1770 - ж кытайлыктар менен", "1771 - ж. калмактар менен", "1775 - ж. моңголдор менен", "1770 - ж. казактар менен"],
        "optionsRu": ["1770 г с китайцами", "1771 г с калмаками", "1775 г с монголами", "1770 г с казахами"],
        "correctIndexKg": 3,
        "correctIndexRu": 3,
        "correctIndex": 3,
    },
    182: {
        "kg": "«Скифтер» деп европалыктар кимдерди аташкан?",
        "ru": "Какие племена европейцы называли «скифами»?",
        "optionsKg": ["Сактарды", "Усундарды", "Хундарды", "Түрктөрдү"],
        "optionsRu": ["Саков", "Усунов", "Хуннов", "Тюрков"],
        "correctIndexKg": 0,
        "correctIndexRu": 0,
        "correctIndex": 0,
    },
}

FONT_RESOURCE_TO_OBJECT = {1: 5, 2: 12, 3: 17, 4: 19, 5: 24, 6: 26, 7: 28}
TYPE0_FONT_OBJECTS = {5, 12, 19}
WINANSI_FONT_OBJECTS = {17, 24, 26, 28}


def load_bytes(source_path: Path) -> bytes:
    return source_path.read_bytes()


def extract_streams(data: bytes):
    for match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, re.S):
        raw = match.group(1)
        try:
            yield zlib.decompress(raw)
        except zlib.error:
            continue


def decode_cmap(data: bytes, cmap_obj: int):
    match = re.search(
        rb"%d 0 obj\r?\n<</Filter/FlateDecode/Length \d+>>\r?\nstream\r?\n(.*?)\r?\nendstream"
        % cmap_obj,
        data,
        re.S,
    )
    if not match:
        raise RuntimeError(f"Missing CMap object {cmap_obj}")

    cmap = zlib.decompress(match.group(1)).decode("latin1")
    mapping = {}

    for block in re.finditer(r"beginbfchar\s*(.*?)\s*endbfchar", cmap, re.S):
        for line in block.group(1).strip().splitlines():
            parts = re.findall(r"<([^>]+)>", line)
            if len(parts) == 2:
                mapping[parts[0].upper()] = bytes.fromhex(parts[1]).decode("utf-16-be", errors="replace")

    for block in re.finditer(r"beginbfrange\s*(.*?)\s*endbfrange", cmap, re.S):
        for line in block.group(1).strip().splitlines():
            parts = re.findall(r"<([^>]+)>", line)
            if len(parts) < 3:
                continue

            start_hex, end_hex = parts[0], parts[1]
            start = int(start_hex, 16)
            end = int(end_hex, 16)

            if "[" in line:
                values = re.findall(r"<([^>]+)>", line)[2:]
                for index, code in enumerate(range(start, end + 1)):
                    mapping[f"{code:04X}"] = bytes.fromhex(values[index]).decode("utf-16-be", errors="replace")
            else:
                base = int(parts[2], 16)
                for code in range(start, end + 1):
                    mapping[f"{code:04X}"] = chr(base + code - start)

    return mapping


def decode_hex_string(hex_text: str, font_obj: int, type0_maps, winansi_maps):
    if font_obj in TYPE0_FONT_OBJECTS:
        mapping = type0_maps[font_obj]
        output = []
        for index in range(0, len(hex_text), 4):
            output.append(mapping.get(hex_text[index:index + 4].upper(), ""))
        return "".join(output)

    if font_obj in WINANSI_FONT_OBJECTS:
        try:
            return bytes.fromhex(hex_text).decode("cp1252", errors="replace")
        except ValueError:
            return ""

    return ""


def decode_literal_string(text: str, font_obj: int):
    if font_obj in WINANSI_FONT_OBJECTS:
        return text.encode("latin1", errors="ignore").decode("cp1252", errors="replace")
    return text


def normalize_text(text: str):
    text = text.replace("\r", " ").replace("\n", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def is_artifact(text: str):
    stripped = re.sub(r"[\s\uf020\uf031\uf030\uf029\uf028\uf00b\uf00c]", "", text)
    return not stripped


def load_paragraphs(source_path: Path):
    data = load_bytes(source_path)
    type0_maps = {
        5: decode_cmap(data, 1665),
        12: decode_cmap(data, 1668),
        19: decode_cmap(data, 1672),
    }

    paragraphs = []
    for stream in extract_streams(data):
        text = stream.decode("latin1", errors="replace")
        if "BT" not in text or ("TJ" not in text and "Tj" not in text):
            continue

        for block in re.finditer(r"BT(.*?)ET", text, re.S):
            current_font = None
            current_color = "000000"

            for raw_line in block.group(1).splitlines():
                line = raw_line.strip()
                if not line:
                    continue

                font_match = re.search(r"/F(\d+)\s+\d+(?:\.\d+)?\s+Tf", line)
                if font_match:
                    current_font = FONT_RESOURCE_TO_OBJECT.get(int(font_match.group(1)), int(font_match.group(1)))

                color_match = re.search(r"(?<!\S)([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+([0-9]*\.?[0-9]+)\s+rg(?!\S)", line)
                if color_match:
                    red = float(color_match.group(1))
                    green = float(color_match.group(2))
                    blue = float(color_match.group(3))
                    current_color = f"{round(red * 255):02X}{round(green * 255):02X}{round(blue * 255):02X}"

                if "Tj" not in line and "TJ" not in line:
                    continue

                parts = []
                for token in re.finditer(r"<([^>]+)>|\((.*?)\)", line):
                    hex_text = token.group(1)
                    literal_text = token.group(2)
                    if hex_text is not None:
                        parts.append(decode_hex_string(hex_text, current_font, type0_maps, None))
                    elif literal_text is not None:
                        parts.append(decode_literal_string(literal_text, current_font))

                decoded = normalize_text("".join(parts))
                if not decoded or is_artifact(decoded):
                    continue

                paragraphs.append(
                    {
                        "text": decoded,
                        "runs": [(decoded, current_color)],
                    }
                )

    return paragraphs


def has_option_marker(text: str) -> bool:
    return OPTION_MARK_RE.search(text) is not None


def split_question_paragraph(text: str):
    match = QUESTION_RE.match(text)
    if not match:
        raise ValueError(f"Not a question paragraph: {text}")
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
    expected_number = 1

    def parse_start(position, number):
        if position >= len(paragraphs):
            return None

        current = paragraphs[position]
        match = QUESTION_RE.match(current["text"])
        if match and int(match.group(1)) == number:
            start_text = (match.group(2) or "").strip()
            option_match = OPTION_MARK_RE.search(start_text)
            if option_match:
                return {
                    "number": number,
                    "question": start_text[:option_match.start()].strip(),
                    "inline_options": start_text[option_match.start():].strip(),
                    "consumed": 1,
                }
            return {
                "number": number,
                "question": start_text,
                "inline_options": None,
                "consumed": 1,
            }

        standalone = re.fullmatch(r"\s*(\d+)\s*[\.)]?\s*", current["text"])
        if standalone and int(standalone.group(1)) == number:
            if position + 1 >= len(paragraphs):
                return None
            next_text = paragraphs[position + 1]["text"]
            if QUESTION_RE.match(next_text):
                return None
            return {
                "number": number,
                "question": next_text.lstrip(" .«»\"'`:-–—"),
                "inline_options": None,
                "consumed": 2,
            }

        return None

    while index < len(paragraphs) and expected_number <= 200:
        start = parse_start(index, expected_number)
        if start is None:
            index += 1
            continue

        number = start["number"]
        question_kg = start["question"]
        inline_kg_options = start["inline_options"]
        index += start["consumed"]

        kg_option_paragraphs = [synthetic_paragraph(inline_kg_options)] if inline_kg_options else []
        while index < len(paragraphs):
            next_same = parse_start(index, expected_number)
            next_next = parse_start(index, expected_number + 1)
            if next_same is not None or next_next is not None:
                break

            if has_option_marker(paragraphs[index]["text"]) or kg_option_paragraphs:
                kg_option_paragraphs.append(paragraphs[index])
            else:
                question_kg = f"{question_kg} {paragraphs[index]['text']}".strip()
            index += 1

        question_ru = ""
        ru_option_paragraphs = []

        if index < len(paragraphs):
            ru_start = parse_start(index, expected_number)
            if ru_start is not None:
                question_ru = ru_start["question"]
                inline_ru_options = ru_start["inline_options"]
                index += ru_start["consumed"]

                if inline_ru_options:
                    ru_option_paragraphs.append(synthetic_paragraph(inline_ru_options))

                while index < len(paragraphs):
                    next_start = parse_start(index, expected_number + 1)
                    if next_start is not None:
                        break

                    if has_option_marker(paragraphs[index]["text"]) or ru_option_paragraphs:
                        ru_option_paragraphs.append(paragraphs[index])
                    else:
                        question_ru = f"{question_ru} {paragraphs[index]['text']}".strip()
                    index += 1

        options_kg, correct_kg = parse_options(kg_option_paragraphs)
        options_ru, correct_ru = parse_options(ru_option_paragraphs)
        correct_index_kg = MANUAL_CORRECT.get(number, correct_kg if correct_kg is not None else correct_ru)
        correct_index_ru = MANUAL_CORRECT.get(number, correct_ru if correct_ru is not None else correct_kg)
        correct_index = correct_index_kg

        questions.append(
            {
                "number": number,
                "kg": question_kg,
                "ru": question_ru or question_kg,
                "optionsKg": options_kg,
                "optionsRu": options_ru or options_kg,
                "correctIndexKg": correct_index_kg,
                "correctIndexRu": correct_index_ru,
                "correctIndex": correct_index,
            }
        )

        expected_number += 1

    return questions


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python scripts/extract_history_questions_from_pdf.py <source.pdf> [output.js]")

    source_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "тест про исторю" / "questions.js"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    paragraphs = load_paragraphs(source_path)
    questions = build_questions(paragraphs)

    for question in questions:
        override = QUESTION_OVERRIDES.get(question["number"])
        if override:
            question.update(override)

    if len(questions) < 190:
        raise RuntimeError(f"Expected roughly 200 questions, found {len(questions)}")

    broken = []
    for question in questions:
        if len(question["optionsKg"]) < 2 or len(question["optionsRu"]) < 2:
            broken.append(question["number"])
            continue

        if question["correctIndexKg"] is None or question["correctIndexKg"] >= len(question["optionsKg"]):
            broken.append(question["number"])
            continue

        if question["correctIndexRu"] is None or question["correctIndexRu"] >= len(question["optionsRu"]):
            broken.append(question["number"])
    if broken:
        raise RuntimeError(f"Invalid parsed questions: {broken}")

    payload = "window.questionsData = " + json.dumps(questions, ensure_ascii=False, indent=2) + ";\n"
    output_path.write_text(payload, encoding="utf-8")
    print(f"Saved {len(questions)} questions to {output_path}")


if __name__ == "__main__":
    main()
