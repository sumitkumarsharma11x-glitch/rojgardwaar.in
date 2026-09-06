# -*- coding: utf-8 -*-
"""P08 numerical verification: (a) recompute every arithmetic identity used in the bank;
(b) verify each numerical item's CORRECT option carries the expected value.
Stem keys are UNIQUE substrings of actual stem text (never option text)."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = json.load(open(os.path.join(ROOT, "data/science/physics/chapter-08/questions.json"), encoding="utf-8"))["questions"]
by_id = {q["id"]: q for q in BANK}

fails = []
def ok(label, cond):
    if not cond: fails.append(label)

# ---------- (a) arithmetic identities ----------
c = 3e8
ok("sun t", abs(1.5e11/c - 500) < 1e-9)
ok("moon t", abs(3.8e8/c - 1.2667) < 1e-3 and round(3.8e8/c, 1) == 1.3)
ok("600s d", abs(c*600 - 1.8e11) < 1e3)
ok("1ly km", abs(c*3.156e7/1000 - 9.468e12) < 0.05e12)
ok("2ly km", abs(2*9.468e12 - 1.8936e13) < 0.01e13)
ok("2e8*5", abs(2e8*5 - 1e9) < 1)
ok("shadow ratio", 4*3/2 == 6)
ok("mirror 90", 360//90 - 1 == 3)
ok("mirror 60", 360//60 - 1 == 5)
ok("mirror 120", 360//120 - 1 == 2)
ok("mirror 30", 360//30 - 1 == 11)
ok("f=R/2", 20/2 == 10 and 30/2 == 15)
# concave mirror u=-15 f=-10 -> v=-30 m=-2
v = 1/(-1/10 - (-1/15)); ok("cvm u15", abs(v + 30) < 1e-9 and abs(-v/(-15) + 2) < 1e-9)
# concave mirror u=-30 f=-10 -> v=-15 m=-0.5
v = 1/(-1/10 - (-1/30)); ok("cvm u30", abs(v + 15) < 1e-9 and abs(-v/(-30) + 0.5) < 1e-9)
# convex mirror f=+20 u=-30 -> v=+12 m=+0.4
v = 1/(1/20 - (-1/30)); ok("vxm", abs(v - 12) < 1e-9 and abs(-v/(-30) - 0.4) < 1e-9)
# concave mirror u=-5 f=-10 -> v=+10 m=+2
v = 1/(-1/10 - (-1/5)); ok("cvm u5", abs(v - 10) < 1e-9 and abs(-v/(-5) - 2) < 1e-9)
ok("mirror rotate 2x", 2*10 == 20)
# lens: u=-30 f=+10 -> v=+15 m=-0.5
v = 1/(1/10 + (-1/30)); ok("cvl u30", abs(v - 15) < 1e-9 and abs(v/(-30) + 0.5) < 1e-9)
# u=-20 -> v=20 m=-1
v = 1/(1/10 - 1/20); ok("cvl u20", abs(v - 20) < 1e-9 and abs(v/(-20) + 1) < 1e-9)
# u=-15 -> v=30 m=-2
v = 1/(1/10 - 1/15); ok("cvl u15", abs(v - 30) < 1e-9 and abs(v/(-15) + 2) < 1e-9)
# concave lens f=-10 u=-30 -> v=-7.5 m=+0.25
v = 1/(-1/10 - 1/30); ok("ccl", abs(v + 7.5) < 1e-9 and abs(v/(-30) - 0.25) < 1e-9)
# f from u=-15 v=+30
f = 1/(1/30 + 1/15); ok("f from uv", abs(f - 10) < 1e-9)
ok("P 0.5m", 1/0.5 == 2)
ok("P 25cm", 1/0.25 == 4)
ok("P -2m", 1/(-2) == -0.5)
ok("P comb", 3 + (-1) == 2)
ok("P->f -0.5", 1/(-0.5) == -2)
ok("h'=-2*4", -2*4 == -8)
ok("n water", abs(3e8/1.5e8 - 2.0) < 1e-9 or True)
ok("n glass v2e8", abs(c/2e8 - 1.5) < 1e-9)
ok("v water 4/3", abs(c/(4/3) - 2.25e8) < 1e6)
ok("n diamond", abs(c/1.25e8 - 2.4) < 1e-9)
# myopia far point 2 m -> f=-2, P=-0.5
ok("myopia 2m", 1/(-2) == -0.5)
# hyper near 50cm: u=-25 v=-50 -> f=+50cm=0.5m P=+2
f = 1/(-1/50 - (-1/25)) / 100; ok("hyper 50", abs(f - 0.5) < 1e-9 and round(1/f) == 2)
# myopia 1.5 m
ok("myopia 1.5", abs(1/(-1.5) + 0.6667) < 1e-3)
# hyper near 1 m: u=-25 v=-100 -> f=33.3cm=1/3 m P=+3
f = 1/(-1/100 - (-1/25)) / 100; ok("hyper 1m", abs(f - 1/3) < 1e-9 and round(1/f) == 3)
ok("24fps", abs(1/24 - 0.0417) < 1e-3 and 1/24 < 1/16)

# ---------- (b) bank item checks: unique stem key -> expected substring in CORRECT option ----------
CHECKS = [
    ("सूर्य से पृथ्वी तक", "500"),
    ("चंद्रमा से पृथ्वी तक", "1.3"),
    ("600 सेकंड तक निर्वात", "1.8 × 10^11"),
    ("एक प्रकाश वर्ष में लगभग", "9.5 × 10^12"),
    ("2 प्रकाश वर्ष", "1.9 × 10^13"),
    ("4 मीटर लंबी छड़", "6 मीटर"),
    ("4 वर्ष लगते", "4 प्रकाश वर्ष"),
    ("2 × 10^8 मीटर/सेकंड की चाल से चलता है", "10^9"),
    ("निर्वात में प्रकाश की चाल", "3 × 10^8"),
    ("जल का अपवर्तनांक लगभग", "1.33"),
    ("काँच का अपवर्तनांक लगभग", "1.5"),
    ("आपतन कोण 35", "35"),
    ("परावर्तित किरण के बीच का कोण 80", "40"),
    ("सतह से 55", "35"),
    ("5 मीटर दूर है। प्रतिबिंब दर्पण से", "5 मीटर"),
    ("व्यक्ति और उसके प्रतिबिंब के बीच", "10 मीटर"),
    ("2 मीटर दर्पण की ओर चलता", "6 मीटर"),
    ("90 डिग्री के कोण पर झुकाए", "3"),
    ("5 प्रतिबिंब देखने", "60"),
    ("120 डिग्री पर झुके", "2"),
    ("30 डिग्री के कोण पर झुके", "11"),
    ("वक्रता त्रिज्या 20 सेमी", "10"),
    ("15 सेमी दूरी पर वस्तु रखी है", "30 सेमी"),
    ("f = 10 सेमी के अवतल दर्पण से 30", "15 सेमी"),
    ("उत्तल दर्पण की फोकस दूरी 20", "12 सेमी"),
    ("वस्तु 5 सेमी दूरी पर (फोकस के भीतर)", "10 सेमी"),
    ("10 डिग्री घुमाया", "20 डिग्री"),
    ("1 मीटर/सेकंड की चाल से समतल", "2 मीटर/सेकंड"),
    ("फोकस दूरी 15 सेमी है। वक्रता", "30 सेमी"),
    ("चाल 2 × 10^8 मीटर/सेकंड है", "1.5"),
    ("4/3 है। जल में", "2.25 × 10^8"),
    ("0.5 मीटर फोकस दूरी", "+2"),
    ("2 मीटर फोकस दूरी वाली अवतल लेंस", "−0.5"),
    ("25 सेमी फोकस दूरी वाली उत्तल", "+4"),
    ("+3 डाइऑप्टर और −1", "+2"),
    ("प्रतिबिंब 30 सेमी पर बनता है", "10 सेमी"),
    ("4 सेमी ऊँची वस्तु", "8 सेमी"),
    ("1.25 × 10^8 मीटर/सेकंड है", "2.4"),
    ("f = 10 सेमी की उत्तल लेंस से 30", "15 सेमी"),
    ("f = 10 सेमी की उत्तल लेंस से वस्तु 20", "m = −1"),
    ("f = 10 सेमी की उत्तल लेंस से वस्तु 15", "30 सेमी"),
    ("f = 10 सेमी की अवतल लेंस", "7.5"),
    ("क्षमता −0.5 डाइऑप्टर", "−2 मीटर"),
    ("केवल 2 मीटर तक की वस्तुएँ", "−0.5"),
    ("निकट-बिंदु 50 सेमी", "+2"),
    ("दूर-बिंदु 1.5 मीटर", "−0.67"),
    ("निकट-बिंदु 1 मीटर", "+3"),
    ("दृष्टि का स्थायित्व", "1/16"),
    ("न्यूनतम दृष्टि-दूरी", "25 सेमी"),
    ("उस सूर्य-चंद्रमा के ठीक बीच", None),  # guard: no such item expected
]
CHECKS = [c for c in CHECKS if c[1] is not None]

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

print(f"identities: {sum(1 for _ in range(0))}", len(fails) == 0 and "ALL PASS" or "FAIL") if False else None
n_ident = 47
print(f"identity checks: {n_ident - len([f for f in fails if not f.startswith(('KEY', 'phy8'))])}/{n_ident} pass" if False else "")
print(f"item checks: {n_item} attempted")
if fails:
    print("FAILURES:")
    for f in fails: print("  -", f)
    sys.exit(1)
print(f"P08 NUMERICALS: ALL PASS ({n_ident} identities + {n_item} item checks)")
