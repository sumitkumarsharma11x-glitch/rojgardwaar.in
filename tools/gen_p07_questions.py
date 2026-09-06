# -*- coding: utf-8 -*-
"""Generate data/science/physics/chapter-07/questions.json (P07 — Sound & Its Applications).
Builds exactly 150 bilingual questions with ids phy7_q101..phy7_q250 from p07_part1 + p07_part2.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from p07_part1 import PART1
from p07_part2 import PART2

EXPECTED_TOPICS = {
    "sound-production": 38,
    "sound-propagation": 38,
    "wave-characteristics": 37,
    "echo-ultrasound": 37,
}
ID_PREFIX = "phy7_q"
ID_START = 101

def main():
    rows = PART1 + PART2
    assert len(rows) == 150, f"expected 150 rows, got {len(rows)}"

    order = list(EXPECTED_TOPICS.keys())
    rows.sort(key=lambda r: order.index(r[0]))

    counts = {}
    for r in rows:
        counts[r[0]] = counts.get(r[0], 0) + 1
    assert counts == EXPECTED_TOPICS, f"topic counts mismatch: {counts}"

    questions = []
    for i, (topic, diff, qhi, qen, ohi, oen, correct, ehi, een) in enumerate(rows):
        assert diff in ("easy", "medium", "hard"), f"bad difficulty: {diff}"
        assert len(ohi) == 4 and len(oen) == 4, f"need 4 options: {qen[:50]}"
        assert 0 <= correct <= 3, f"bad correct index: {correct}"
        assert all(isinstance(x, str) and x.strip() for x in ohi + oen), "empty/non-str option"
        questions.append({
            "id": f"{ID_PREFIX}{ID_START + i}",
            "topic": topic,
            "difficulty": diff,
            "question": {"hi": qhi, "en": qen},
            "options": {"hi": ohi, "en": oen},
            "correct": correct,
            "explanation": {"hi": ehi, "en": een},
        })

    # Balance answer positions: cyclically rotate options (hi+en together) so the
    # correct option lands in the currently least-filled bucket. Deterministic and
    # content-neutral — relative option order and pairing are preserved.
    buckets = {0: 0, 1: 0, 2: 0, 3: 0}
    for q in questions:
        cur = q["correct"]
        target = min(buckets, key=lambda b: (buckets[b], b))
        shift = (target - cur) % 4
        if shift:
            q["options"]["hi"] = q["options"]["hi"][-shift:] + q["options"]["hi"][:-shift]
            q["options"]["en"] = q["options"]["en"][-shift:] + q["options"]["en"][:-shift]
            q["correct"] = target
        buckets[target] += 1

    out_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "science", "physics", "chapter-07", "questions.json",
    )
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"questions": questions}, f, ensure_ascii=False, indent=2)
        f.write("\n")

    diff_counts = {d: sum(1 for q in questions if q["difficulty"] == d) for d in ("easy", "medium", "hard")}
    idx_counts = {i: sum(1 for q in questions if q["correct"] == i) for i in range(4)}
    print(f"WROTE {out_path}")
    print(f"  total={len(questions)} topics={counts}")
    print(f"  difficulty={diff_counts}  correct-index={idx_counts}")

if __name__ == "__main__":
    main()
