# -*- coding: utf-8 -*-
"""P10 numerical verification: (a) recompute every arithmetic identity used in the bank;
(b) verify each numerical item's CORRECT option carries the expected value.
Stem keys are UNIQUE substrings of actual stem text (never option text)."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = json.load(open(os.path.join(ROOT, "data/science/physics/chapter-10/questions.json"), encoding="utf-8"))["questions"]

fails = []
def ok(label, cond):
    if not cond: fails.append(label)

# ---------- (a) arithmetic identities ----------
ok("turns 100->300 = 3x", 300/100 == 3)
ok("amp-turns 200x2=400", 200*2 == 400)
ok("amp-turns 600x1=600", 600*1 == 600)
ok("ratio 600/400 = 1.5", 600/400 == 1.5)
ok("q249 power 5x2", 5*2 == 10)                       # coil input power (setup only)
ok("series turns > 2x", (2*1 + 1) > 2*1)              # doubled + identical series coil -> 3x > 2x
ok("T of 50 Hz", abs(1/50 - 0.02) < 1e-12)
ok("50 Hz flips", 2*50 == 100)                        # 2 reversals per cycle
ok("gen turns 400/100", 400/100 == 4)
ok("E 750W x 4s", 750*4 == 3000)
ok("torque 6/2", 6/2 == 3)
ok("cycles 5x2", 5*2 == 10)
ok("T of 100 Hz", abs(1/100 - 0.01) < 1e-12)
ok("induced 600/200", 600/200 == 3)
ok("heat 1000-800", 1000-800 == 200)
ok("3 pieces -> 6 poles", 3*2 == 6)
N_IDENT = 16

# ---------- (b) bank item checks ----------
CHECKS = [
    ("कुंडली में 100 फेरे हैं। फेरे बढ़ाकर 300", "तीन गुना"),
    ("उठा सकता है 20 किलोग्राम", "अस्थायी"),
    ("200 फेरे और 2 एम्पियर धारा", "1.5 गुना"),
    ("5 वोल्ट पर 2 एम्पियर बहता है", "दुगुने से अधिक"),
    ("50 हर्ट्ज़ AC का एक चक्र", "0.02"),
    ("धारा की दिशा एक सेकंड में कितनी बार", "100"),
    ("100 फेरों की है। उसी आकार की 400", "चार गुना"),
    ("शक्ति 750 वाट है। 4 सेकंड", "3000 जूल"),
    ("धारा 6 एम्पियर करने पर बल-आघूर्ण", "3 गुना"),
    ("प्रति सेकंड 5 चक्र घूमती है", "10 चक्र"),
    ("आवृत्ति बढ़कर 100 हर्ट्ज़", "0.01"),
    ("0.5 सेकंड तक एकसमान गति से घुसेड़ा", "शून्य हो जाता है"),
    ("फेरे 200 से 600 किए गए", "3 गुना"),
    ("1000 जूल/सेकंड है और उत्पादित", "ऊष्मा"),
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
print(f"P10 NUMERICALS: ALL PASS ({N_IDENT} identities + {n_item} item checks)")
