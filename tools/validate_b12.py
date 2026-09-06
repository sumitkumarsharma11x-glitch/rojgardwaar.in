# -*- coding: utf-8 -*-
"""Validate B11 (bio chapter-11) question bank: structure + duplicate/stem-similarity
against all ELEVEN locked banks (B01 ch-01, B09 ch-02, B02 ch-03, B03 ch-04, B04 ch-05,
B05 ch-06, B06 ch-07, B07 ch-08, B08 ch-09, B10 ch-10, B11 ch-11) and within itself — plus an explicit
GENERATION-ARTIFACT SCAN (stray trailing numbers, placeholders, markers, template
fragments, duplicate punctuation, unfinished sentences) on every text field.

Similarity = content-token Jaccard (template/stop words stripped from hi+en stems).
Hard-fail: similarity >= 0.75.  Advisory: 0.50-0.749.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPECTED_TOPICS = {
    "environment-components": 20,
    "ecosystem-structure": 25,
    "food-chains-webs": 25,
    "energy-flow-relations": 20,
    "natural-resources-conservation": 25,
    "pollution-waste-sustainability": 35,
}

STOP_EN = set("""which of the following is are not a an type types main function functions what where
how many much why this that these those in on at to for from with by as and or be been being made make
found find consider considered called known example examples kind sort part parts under classification
place placed category one single""".split())

STOP_HI = set("""का की के को में से क्या कौन कौनसा किस किसे निम्न निम्नलिखित लिखित पर और यह वह है हैं होता होती होते
कहते कहा कहलाता जाता तात्पर्य उदाहरण प्रकार कैसे कितने कितनी कहाँ मुख्य कार्य नहीं बताइए कीजिए शरीर मानव पौधे प्राणी
वर्गीकरण वर्ग एक आधारित अंतर्गत रखा सम्बंधित संबंधित वाला वाली वाले करता करती करते द्वारा सहायक सहायता सही गलत""".split())

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

# ---------- artifact scan patterns ----------
RE_TRAILING_NUM = re.compile(r"[\u0900-\u097F\w][\s'”\")\]]*\d{1,3}\s*$")   # "... है? 3" / "cell 2"
RE_MARKER = re.compile(r"PLACEHOLDER|TODO|TBD|XXX|REMOVE ME|Lorem|FIXME|\<|\{|\}|undefined|null(?!a)", re.I)
RE_DUP_PUNCT = re.compile(r"।{2,}|\?{2,}|\.{3,}|!{2,}|,,| ।| ?।\.")
RE_UNFINISHED = re.compile(r"\b(क्या|कौन|किस|what|which|why|how)\b\s*$", re.I)

def artifact_scan(bank, errors):
    hits = 0
    for q in bank:
        qid = q.get("id", "?")
        fields = {
            "question.hi": q.get("question", {}).get("hi", ""),
            "question.en": q.get("question", {}).get("en", ""),
            "explanation.hi": q.get("explanation", {}).get("hi", ""),
            "explanation.en": q.get("explanation", {}).get("en", ""),
        }
        for lang in ("hi", "en"):
            for j, o in enumerate(q.get("options", {}).get(lang, [])):
                fields[f"options.{lang}[{j}]"] = o
        for name, text in fields.items():
            if not isinstance(text, str) or not text.strip():
                errors.append(f"ARTIFACT {qid} {name}: empty/non-str")
                hits += 1
                continue
            if name.startswith("question") and RE_TRAILING_NUM.search(text):
                errors.append(f"ARTIFACT {qid} {name}: trailing number -> ...{text[-25:]}")
                hits += 1
            if RE_MARKER.search(text):
                errors.append(f"ARTIFACT {qid} {name}: marker -> {text[:40]}")
                hits += 1
            if RE_DUP_PUNCT.search(text):
                errors.append(f"ARTIFACT {qid} {name}: duplicated punctuation -> ...{text[-25:]}")
                hits += 1
            if name.startswith("question") and RE_UNFINISHED.search(text):
                errors.append(f"ARTIFACT {qid} {name}: unfinished stem -> {text[-30:]}")
                hits += 1
    return hits

def main():
    errors, warnings = [], []

    b12 = load(os.path.join(ROOT, "data/science/biology/chapter-12/questions.json"))
    banks = {
        "B01": load(os.path.join(ROOT, "data/science/biology/chapter-01/questions.json")),
        "B09": load(os.path.join(ROOT, "data/science/biology/chapter-02/questions.json")),
        "B02": load(os.path.join(ROOT, "data/science/biology/chapter-03/questions.json")),
        "B03": load(os.path.join(ROOT, "data/science/biology/chapter-04/questions.json")),
        "B04": load(os.path.join(ROOT, "data/science/biology/chapter-05/questions.json")),
        "B05": load(os.path.join(ROOT, "data/science/biology/chapter-06/questions.json")),
        "B06": load(os.path.join(ROOT, "data/science/biology/chapter-07/questions.json")),
        "B07": load(os.path.join(ROOT, "data/science/biology/chapter-08/questions.json")),
        "B08": load(os.path.join(ROOT, "data/science/biology/chapter-09/questions.json")),
        "B10": load(os.path.join(ROOT, "data/science/biology/chapter-10/questions.json")),
        "B11": load(os.path.join(ROOT, "data/science/biology/chapter-11/questions.json")),
    }

    # 1. count
    if len(b12) != 150:
        errors.append(f"count = {len(b12)} != 150")

    # 2. ids unique & sequential
    ids = [q["id"] for q in b12]
    if len(set(ids)) != len(ids):
        errors.append("duplicate ids")
    if ids != [f"ch12_q{n}" for n in range(1201, 1351)]:
        errors.append("id sequence not exactly ch12_q1201..ch12_q1350")

    # 3. topics
    tc = {}
    for q in b12:
        tc[q["topic"]] = tc.get(q["topic"], 0) + 1
    if tc != EXPECTED_TOPICS:
        errors.append(f"topic counts mismatch: {tc}")

    # 4. per-question structure (7 keys exactly)
    FIELDS = ("id", "topic", "difficulty", "question", "options", "correct", "explanation")
    for q in b12:
        qid = q.get("id", "?")
        if set(q.keys()) != set(FIELDS):
            errors.append(f"{qid}: keys not exactly the 7-key schema: {sorted(q.keys())}")
        for fld in FIELDS:
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

    # 5. difficulty mix
    dc = {d: sum(1 for q in b12 if q["difficulty"] == d) for d in ("easy", "medium", "hard")}
    pct = {d: round(100 * n / max(len(b12), 1), 1) for d, n in dc.items()}
    for d, lo, hi_ in (("easy", 30, 35), ("medium", 50, 60), ("hard", 10, 15)):
        if not lo <= pct[d] <= hi_:
            errors.append(f"difficulty {d} = {pct[d]}% outside {lo}-{hi}%")

    # 6. GENERATION-ARTIFACT SCAN
    art = artifact_scan(b12, errors)
    print(f"artifact-scan: {art} suspicious hit(s)")

    # 7. similarity: within B11, and vs all 9 locked banks
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

    check_cross("B12-internal", b12, b12, errors, warnings, internal=True)
    for name, bank in banks.items():
        check_cross(f"vs-{name}", b12, bank, errors, warnings)

    # report
    idx = {i: sum(1 for q in b12 if q["correct"] == i) for i in range(4)}
    print(f"count={len(b12)}  difficulty={dc} ({pct}%)  correct-index={idx}")
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
