import json, math, sys

qs = json.load(open("data/science/physics/chapter-03/questions.json", encoding="utf-8"))["questions"]
CHECKS = [
    # ---- T1 force-and-effects ----
    ("Forces of 10 N east and 10 N west", "stays in its existing state"),
    ("8 N rightward and 3 N leftward", "5 N to the right"),
    ("12 N northward and 5 N southward", "7 N north"),
    ("6 N and 8 N act in the same direction", "14 N in that direction"),
    ("3 N and 4 N act at right angles", "5 N"),
    ("with 25 N and 35 N", "60 N in that direction"),
    ("5 N east, 5 N west and 3 N north", "3 N north"),
    ("9 N and 4 N act on a box in opposite", "Towards the 9 N force"),
    ("maximum and minimum possible resultants", "17 N and 3 N"),
    ("team A pulls with 100 N", "20 N, towards team A"),
    ("Three collinear forces: +6 N", "2 N to the right"),
    # ---- T3 momentum-second-law ----
    ("mass 5 kg accelerates at 2 m/s", "10 N"),
    ("accelerate a 10 kg object at 3 m/s", "30 N"),
    ("A 20 N force acts on a 4 kg mass", "5 m/s²"),
    ("A 12 N force on a 6 kg object", "2 m/s²"),
    ("A 2 kg object moves at 5 m/s", "10 kg·m/s"),
    ("0.5 kg ball flies at 20 m/s", "10 kg·m/s"),
    ("velocity rises from 2 m/s to 6 m/s", "16 kg·m/s"),
    ("momentum changes by 20 kg·m/s in 4 s", "5 N"),
    ("A 3 kg object moves at 4 m/s", "12 kg·m/s"),
    ("produces 5 m/s² of acceleration", "2 kg"),
    ("0.2 kg ball moves at 15 m/s", "3 kg·m/s"),
    ("speeds up from 3 m/s to 8 m/s", "2.5 kg·m/s"),
    ("1000 kg car an acceleration of 2 m/s", "2000 N"),
    ("A 6 N force acts for 2 seconds", "12 kg·m/s"),
    ("slows from 6 m/s to 2 m/s", "8 kg·m/s"),
    ("at rest reaches 10 m/s in 5 s", "10 N"),
    ("hits a wall at 5 m/s and rebounds", "2 kg·m/s"),
    ("50 N force acts for 0.1 s", "5 kg·m/s"),
    ("same time on 2 kg and 4 kg objects", "2 : 1"),
    ("10 N force acts on a 2 kg object at rest for 3 s", "15 m/s"),
    ("mass 4 kg and velocity 0 m/s", "0 kg·m/s"),
    # ---- T4 action-reaction-friction ----
    ("pushed forward with 12 N while friction pulls 5 N", "7 N forward"),
]
fails = []
for stem_key, expect in CHECKS:
    hits = [q for q in qs if stem_key.lower() in q["question"]["en"].lower()]
    if len(hits) != 1:
        fails.append("%s: %d matches" % (stem_key[:45], len(hits)))
        continue
    q = hits[0]
    opt = q["options"]["en"][q["correct"]]
    if expect.lower() not in opt.lower():
        fails.append("%s: want '%s' got '%s'" % (q["id"], expect, opt[:60]))

ok = lambda a, b: math.isclose(a, b, rel_tol=1e-9)
IDENT = [
    ("10-10=0", lambda: ok(10 - 10, 0)),
    ("8-3=5", lambda: ok(8 - 3, 5)),
    ("12-5=7", lambda: ok(12 - 5, 7)),
    ("6+8=14", lambda: ok(6 + 8, 14)),
    ("3-4-5 perp", lambda: ok((3**2 + 4**2) ** 0.5, 5)),
    ("25+35=60", lambda: ok(25 + 35, 60)),
    ("5-5+3=3", lambda: ok(5 - 5 + 3, 3)),
    ("9-4=5", lambda: ok(9 - 4, 5)),
    ("max17 min3", lambda: ok(10 + 7, 17) and ok(10 - 7, 3)),
    ("100-80=20", lambda: ok(100 - 80, 20)),
    ("+6-6+2=+2", lambda: ok(6 - 6 + 2, 2)),
    ("F=5*2", lambda: ok(5 * 2, 10)),
    ("F=10*3", lambda: ok(10 * 3, 30)),
    ("a=20/4", lambda: ok(20 / 4, 5)),
    ("a=12/6", lambda: ok(12 / 6, 2)),
    ("p=2*5", lambda: ok(2 * 5, 10)),
    ("p=0.5*20", lambda: ok(0.5 * 20, 10)),
    ("dp=4*(6-2)", lambda: ok(4 * (6 - 2), 16)),
    ("F=20/4", lambda: ok(20 / 4, 5)),
    ("p=3*4", lambda: ok(3 * 4, 12)),
    ("m=10/5", lambda: ok(10 / 5, 2)),
    ("p=0.2*15", lambda: ok(0.2 * 15, 3)),
    ("dp=0.5*(8-3)", lambda: ok(0.5 * (8 - 3), 2.5)),
    ("F=1000*2", lambda: ok(1000 * 2, 2000)),
    ("dp=6*2", lambda: ok(6 * 2, 12)),
    ("dp=2*(6-2)", lambda: ok(2 * (6 - 2), 8)),
    ("0to10 in5: a=2 F=10", lambda: ok((10 - 0) / 5, 2) and ok(5 * 2, 10)),
    ("rebound dp=0.2*10", lambda: ok(0.2 * (5 + 5), 2)),
    ("dp=50*0.1", lambda: ok(50 * 0.1, 5)),
    ("ratio 2:1", lambda: ok((1 / 2.0) / (1 / 4.0), 2)),
    ("v=(10/2)*3", lambda: ok((10 / 2) * 3, 15)),
    ("p=4*0", lambda: ok(4 * 0, 0)),
    ("net 12-5=7", lambda: ok(12 - 5, 7)),
]
for name, fn in IDENT:
    try:
        if not fn():
            fails.append("IDENTITY FAIL: " + name)
    except Exception as e:
        fails.append("IDENTITY ERR %s: %s" % (name, e))

print("checked %d numerical items + %d arithmetic identities" % (len(CHECKS), len(IDENT)))
print("NUMERICAL VERIFICATION:", "ALL PASS" if not fails else "FAILURES:")
for f in fails:
    print("  -", f)
sys.exit(1 if fails else 0)
