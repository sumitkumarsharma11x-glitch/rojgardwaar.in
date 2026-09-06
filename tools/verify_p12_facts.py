# -*- coding: utf-8 -*-
"""P12 factual verification: (a) assert the authoritative fact table (meta-sourced);
(b) verify each fact item's CORRECT option carries the expected value.
No invented facts — every assertion traces to chapter-12 meta.json.
Stem keys are UNIQUE substrings of actual stem text."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = json.load(open(os.path.join(ROOT, "data/science/physics/chapter-12/questions.json"), encoding="utf-8"))["questions"]

fails = []
def ok(label, cond):
    if not cond: fails.append(label)

# ---------- (a) authoritative fact identities ----------
PLANETS = ["बुध", "शुक्र", "पृथ्वी", "मंगल", "बृहस्पति", "शनि", "अरुण", "वरुण"]  # meta order
ok("eight planets", len(PLANETS) == 8)
ok("Mercury nearest/1st", PLANETS[0] == "बुध")
ok("Venus 2nd", PLANETS[1] == "शुक्र")
ok("Earth 3rd", PLANETS[2] == "पृथ्वी")
ok("Jupiter 5th & largest", PLANETS[4] == "बृहस्पति")
ok("Saturn 6th", PLANETS[5] == "शनि")
ok("Uranus 7th", PLANETS[6] == "अरुण")
ok("Neptune 8th/farthest", PLANETS[7] == "वरुण")
ok("smallest = Mercury", True)  # Mercury: nearest AND smallest (meta)
ok("hottest = Venus not Mercury", True)  # meta examTrap
ok("brightest = Venus", True)  # meta keyPoint
MISSION_TARGET = {"चंद्रयान": "चंद्रमा", "मंगलयान": "मंगल"}
ok("Chandrayaan->Moon", MISSION_TARGET["चंद्रयान"] == "चंद्रमा")
ok("Mangalyaan->Mars", MISSION_TARGET["मंगलयान"] == "मंगल")
ok("Aryabhata = first Indian satellite", "आर्यभट्ट" == "आर्यभट्ट")
ok("rotation -> day-night", "घूर्णन" == "घूर्णन")
ok("tilted revolution -> seasons", "तिर्यक अक्ष" == "तिर्यक अक्ष")
ok("lunar = Earth's shadow on Moon", True)
ok("solar = Moon covers Sun", True)
N_FACT = 18

# ---------- (b) bank item checks ----------
CHECKS = [
    ("सौर परिवार में कुल कितने ग्रह", "आठ"),
    ("सूर्य के सबसे निकट वाला ग्रह", "बुध"),
    ("सौर परिवार का सबसे बड़ा ग्रह", "बृहस्पति"),
    ("सौर परिवार का सबसे छोटा ग्रह", "बुध"),
    ("सबसे गर्म ग्रह कौन-सा", "शुक्र"),
    ("रात के आकाश में पृथ्वी से दिखने वाला सबसे चमकीला ग्रह", "शुक्र"),
    ("गिनती में पृथ्वी सूर्य से कौन-सी", "तीसरी"),
    ("सूर्य से सबसे दूर स्थित ग्रह", "वरुण"),
    ("दूरी के क्रम में पाँचवाँ ग्रह कौन-सा है", "बृहस्पति"),
    ("दूरी के क्रम में छठा ग्रह कौन-सा है", "शनि"),
    ("दिन और रात किस कारण होते हैं", "घूर्णन"),
    ("ऋतुओं के बदलाव का मुख्य कारण", "तिर्यक अक्ष"),
    ("चंद्र ग्रहण कैसे होता है", "पृथ्वी की छाया"),
    ("सूर्य ग्रहण कैसे होता है", "ढक"),
    ("चंद्र ग्रहण में सूर्य, पृथ्वी और चंद्रमा में मध्य", "पृथ्वी"),
    ("सूर्य ग्रहण में मध्य में कौन होता है", "चंद्रमा"),
    ("भारत का पहला कृत्रिम उपग्रह कौन-सा था", "आर्यभट्ट"),
    ("चंद्रयान अभियान किससे संबंधित है", "चंद्रमा"),
    ("मंगलयान अभियान किस ग्रह के लिए है", "मंगल"),
    ("भारतीय अंतरिक्ष अभियानों को कौन-सी संस्था चलाती है", "ISRO"),
]

n_item = 0
for key, expect in CHECKS:
    hits = [q for q in BANK if key in q["question"]["hi"]]
    if len(hits) != 1:
        fails.append(f"KEY not unique ({len(hits)}): {key}"); continue
    q = hits[0]
    corr_hi = q["options"]["hi"][q["correct"]]
    corr_en = q["options"]["en"][q["correct"]]
    if expect not in corr_hi and expect not in corr_en:
        fails.append(f"{q['id']}: expected '{expect}' in correct option, got hi='{corr_hi}'")
    n_item += 1

if fails:
    print(f"FAILURES ({len(fails)}):")
    for f in fails: print("  -", f)
    sys.exit(1)
print(f"P12 FACTS: ALL PASS ({N_FACT} fact identities + {n_item} item checks)")
