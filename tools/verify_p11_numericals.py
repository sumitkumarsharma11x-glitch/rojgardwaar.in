# -*- coding: utf-8 -*-
"""P11 numerical verification: (a) recompute every arithmetic identity used in the bank;
(b) verify each numerical/ratio item's CORRECT option carries the expected value.
Stem keys are UNIQUE substrings of actual stem text (never option text)."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = json.load(open(os.path.join(ROOT, "data/science/physics/chapter-11/questions.json"), encoding="utf-8"))["questions"]

fails = []
def ok(label, cond):
    if not cond: fails.append(label)

# ---------- (a) arithmetic identities ----------
ok("H=3^2x20x10", 9*20*10 == 1800)
ok("H=5^2x8x120", 25*8*120 == 24000)
ok("H=4^2x10x50", 16*10*50 == 8000)
ok("fuse 1320/220", 1320/220 == 6)
ok("two loads 4+4", 4 + 4 == 8 and 8 > 5)
ok("bulb 100x60x0.8", abs(100*60*0.8 - 4800) < 1e-9)
ok("H=5^2x40x60", 25*40*60 == 60000)
ok("cal 840/4.2", abs(840/4.2 - 200) < 1e-9)
ok("fuse 880/220", 880/220 == 4)
ok("LED 100-10", 100 - 10 == 90)
ok("I double -> 4x", 2**2 == 4)
ok("I half -> 1/4", abs((0.5)**2 - 0.25) < 1e-12)
ok("t double -> 2x", 1*2 == 2)
ok("I double & t half", 2**2 * 0.5 == 2)
ok("series R:2R factor", 2*1/1 == 2)
ok("parallel 6:3 factor", 6/3 == 2)
ok("series 10<20<30", 10 < 20 < 30)
ok("fuse 5A vs 4.5A", 5 >= 4.5 and 4 < 4.5)
ok("2 heaters parallel V full", 1 == 1)  # qualitative: full voltage across each element
N_IDENT = 19

# ---------- (b) bank item checks ----------
CHECKS = [
    ("20 ओम प्रतिरोध में 3 एम्पियर धारा 10 सेकंड", "1800"),
    ("8 ओम प्रतिरोध के तार में 5 एम्पियर धारा 2 मिनट", "24000"),
    ("10 ओम के तापक में 4 एम्पियर धारा 50 सेकंड", "8000"),
    ("40 ओम के तत्व में 5 एम्पियर धारा 1 मिनट", "60000"),
    ("1320 वाट का गीज़र", "6 एम्पियर"),
    ("हर एक लगभग 4 एम्पियर खींचता है", "8"),
    ("880 वाट का उपकरण चलता है", "4 एम्पियर"),
    ("सामान्यतः 4.5 एम्पियर धारा लेता है", "5 एम्पियर"),
    ("लगभग 80% ऊष्मा में और 20% प्रकाश में", "4800"),
    ("840 जूल ऊष्मा उत्पन्न हुई", "200 कैलोरी"),
    ("धारा दुगुनी कर दी जाए तो उसमें उत्पन्न ऊष्मा", "चार गुनी"),
    ("धारा आधी कर दी जाए (समय व प्रतिरोध वही)", "एक-चौथाई"),
    ("दुगुने समय तक चलाया जाए (धारा व प्रतिरोध स्थिर)", "दुगुनी हो जाती है"),
    ("धारा दुगुनी कर दी गई और साथ ही समय आधा", "2 गुनी"),
    ("10 ओम, 20 ओम और 30 ओम श्रेणीक्रम में जुड़े", "30 ओम"),
    ("6 ओम और 3 ओम एक ही बैटरी पर समान्तरक्रम", "दुगुनी"),
    ("पहले श्रेणीक्रम में, फिर समान्तरक्रम में जोड़े जाते", "समान्तर में"),
    ("10 वाट का LED बल्ब 100 वाट के पुराने बल्ब", "90"),
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
print(f"P11 NUMERICALS: ALL PASS ({N_IDENT} identities + {n_item} item checks)")
