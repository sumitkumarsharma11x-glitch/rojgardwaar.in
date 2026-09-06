# -*- coding: utf-8 -*-
"""Validate B03 (bio chapter-04) question bank: structure + duplicate/stem-similarity
against locked banks B01 (chapter-01), B09 (chapter-02) and B02 (chapter-03), and within itself.

Similarity = content-token Jaccard (template/stop words stripped from hi+en stems),
so boilerplate stems ("Which of the following is a ...?") only match when the actual
SUBJECT overlaps — mirroring the project rule that a <=2-word-changed stem is a duplicate.
Hard-fail: similarity >= 0.75.  Advisory: 0.50-0.749.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPECTED_TOPICS = {
    "animal-diversity": 30,
    "classification-hierarchy": 25,
    "five-kingdoms": 25,
    "plant-diversity": 25,
    "heredity-variation": 25,
    "habitats-adaptations": 20,
}

STOP_EN = set("""which of the following is are not a an type types main function functions what where
how many much why this that these those in on at to for from with by as and or be been being made make
found find consider considered called known example examples kind sort part parts
under classification place placed category one single""".split())

STOP_HI = set("""का की के को में से क्या कौन कौनसा किस किसे निम्न निम्नलिखित लिखित पर और यह वह है हैं होता होती होते
कहते कहा कहलाता जाता तात्पर्य उदाहरण प्रकार कैसे कितने कितनी कहाँ मुख्य कार्य नहीं बताइए कीजिए शरीर मानव पौधे प्राणी
वर्गीकरण वर्ग एक आधारित अंतर्गत रखा सम्बंधित संबंधित वाला वाली वाले करता करती करते द्वारा सहायक सहायता""".split())

def load(path):
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    return d["questions"] if isinstance(d, dict) else d

def norm(s):
    s = s.lower()
    s = re.sub(r"[^\w\s\u0900-\u097F]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def tokens(s):
    out = []
    for t in norm(s).split():
        if not t or t in STOP_EN or t in STOP_HI:
            continue
        if len(t) <= 2 and not t.isdigit():
            continue
        out.append(t)
    return out

def stem_tokens(q):
    return set(tokens(q["question"]["hi"])) | set(tokens(q["question"]["en"]))

def sim(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)

def main():
    errors, warnings = [], []

    b03 = load(os.path.join(ROOT, "data/science/biology/chapter-04/questions.json"))
    b01 = load(os.path.join(ROOT, "data/science/biology/chapter-01/questions.json"))
    b02 = load(os.path.join(ROOT, "data/science/biology/chapter-03/questions.json"))
    b09 = load(os.path.join(ROOT, "data/science/biology/chapter-02/questions.json"))

    # 1. count
    if len(b03) != 150:
        errors.append(f"count = {len(b03)} != 150")

    # 2. ids unique & sequential
    ids = [q["id"] for q in b03]
    if len(set(ids)) != len(ids):
        errors.append("duplicate ids")
    if ids != [f"ch4_q{n}" for n in range(401, 551)]:
        errors.append("id sequence not exactly ch4_q401..ch4_q550")

    # 3. topics
    tc = {}
    for q in b03:
        tc[q["topic"]] = tc.get(q["topic"], 0) + 1
    if tc != EXPECTED_TOPICS:
        errors.append(f"topic counts mismatch: {tc}")

    # 4. per-question structure
    for q in b03:
        qid = q.get("id", "?")
        for fld in ("id", "topic", "difficulty", "question", "options", "correct", "explanation"):
            if fld not in q:
                errors.append(f"{qid}: missing field {fld}")
        if q.get("difficulty") not in ("easy", "medium", "hard"):
            errors.append(f"{qid}: bad difficulty {q.get('difficulty')}")
        for lang in ("hi", "en"):
            if not q.get("question", {}).get(lang, "").strip():
                errors.append(f"{qid}: empty question.{lang}")
            if not q.get("explanation", {}).get(lang, "").strip():
                errors.append(f"{qid}: empty explanation.{lang}")
            opts = q.get("options", {}).get(lang, [])
            if len(opts) != 4 or any((not isinstance(o, str) or not o.strip()) for o in opts):
                errors.append(f"{qid}: bad options.{lang}")
            if len(set(opts)) != len(opts):
                errors.append(f"{qid}: duplicate option text in {lang}")
        if not isinstance(q.get("correct"), int) or not 0 <= q.get("correct", -1) <= 3:
            errors.append(f"{qid}: bad correct index")

    # 5. difficulty mix (blueprint bands: easy 30-35%, medium 50-60%, hard 10-15%)
    dc = {d: sum(1 for q in b03 if q["difficulty"] == d) for d in ("easy", "medium", "hard")}
    pct = {d: round(100 * n / max(len(b03), 1), 1) for d, n in dc.items()}
    for d, lo, hi_ in (("easy", 30, 35), ("medium", 50, 60), ("hard", 10, 15)):
        if not lo <= pct[d] <= hi_:
            errors.append(f"difficulty {d} = {pct[d]}% outside {lo}-{hi}%")

    # 6. similarity: within B02, and vs locked banks B01/B09
    def check_cross(name, new_qs, old_qs, errs, warns, internal=False):
        for i, n in enumerate(new_qs):
            sn = stem_tokens(n)
            old_iter = old_qs[i + 1:] if internal else old_qs
            for o in old_iter:
                r = sim(sn, stem_tokens(o))
                if r >= 0.75:
                    errs.append(f"[{name}] {n['id']} vs {o['id']} r={r:.2f}\n    NEW: {n['question']['en']}\n    OLD: {o['question']['en']}")
                elif r >= 0.50:
                    warns.append(f"[{name}] {n['id']} vs {o['id']} r={r:.2f} :: {n['question']['en']}  <->  {o['question']['en']}")

    check_cross("B03-internal", b03, b03, errors, warnings, internal=True)
    check_cross("vs-B01", b03, b01, errors, warnings)
    check_cross("vs-B09", b03, b09, errors, warnings)
    check_cross("vs-B02", b03, b02, errors, warnings)

    # report
    idx = {i: sum(1 for q in b03 if q["correct"] == i) for i in range(4)}
    print(f"count={len(b03)}  difficulty={dc} ({pct}%)  correct-index={idx}")
    print(f"topics={tc}")
    if warnings:
        print(f"\nADVISORY (0.50-0.75): {len(warnings)} pair(s)")
        for w in warnings:
            print("  " + w)
    if errors:
        print(f"\nFAIL: {len(errors)} error(s)")
        for e in errors:
            print("  " + e)
        sys.exit(1)
    print("\nALL CHECKS PASSED")

if __name__ == "__main__":
    main()
