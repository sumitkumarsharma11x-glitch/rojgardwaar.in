import json, math, sys

qs = json.load(open("data/science/physics/chapter-02/questions.json", encoding="utf-8"))["questions"]
CHECKS = [
    ("100 metres from home", "200 metres"),
    ("Walking 4 metres east and then 3 metres north", "5 metres"),
    ("In the same case (4 m east", "7 metres"),
    ("circular track has a 400", "Distance 200 m, displacement 127 m"),
    ("moves 5 m east, then 5 m west", "10 m, zero"),
    ("8 m east and 6 m north", "4 metres"),
    ("5 m west and then 12 m north", "13 metres"),
    ("300 km north, then 400 km east", "500 km"),
    ("covers 100 metres in 20 seconds", "5 m/s"),
    ("3 km in 10 minutes", "5 m/s"),
    ("at 5 m/s for 20 seconds", "100 metres"),
    ("4.5 km in 15 minutes", "18 km/h"),
    ("200-metre race in 25 seconds", "8 m/s"),
    ("Convert 72 km/h", "20 m/s"),
    ("How many m/s is 36 km/h", "10 m/s"),
    ("A car at 90 km/h", "25 m/s"),
    ("Converting 54 km/h", "15 m/s"),
    ("2 hours at 30 km/h", "40 km/h"),
    ("Up a hill at 20 km/h", "24 km/h"),
    ("60 m in 10 s, then 40 m in 30 s", "2.5 m/s"),
    ("At 60 km/h for 2 hours", "120 kilometres"),
    ("15 m/s, in what time", "40 seconds"),
    ("moving at 10 m/s in a straight line — displacement", "300 metres"),
    ("9 km in half an hour", "5 m/s"),
    ("one and a half rounds of a 500 m", "Distance 750 m, average speed 7.5 m/s"),
    ("one and a half rounds), what are the displacement", "1.59 m/s"),
    ("rows 3 km/h", "4 km/h"),
    ("thunder was heard 3 seconds", "1020 metres"),
    ("100 m in 10 s and another 200 m in 25 s", "10 m/s versus 8"),
    ("goes 48 m out and returns", "Speed 8 m/s, velocity zero"),
    ("from 10 m/s to 20 m/s in 5 s", "2 m/s²"),
    ("from 0 to 16 m/s in 8 s", "2 m/s²"),
    ("falls from 30 m/s to 10 m/s", "−4 m/s²"),
    ("from 25 m/s to 15 m s in 5 s".replace(" s ", "/s "), "−2 m/s²"),
    ("bicycle reaches 10 m/s in 5 s", "2 m/s²"),
    ("comes to rest from 18 km/h", "5 m/s"),
    ("gains 5 m/s of velocity in 5 s", "1 m/s²"),
    ("36 km/h to 54 km/h in 3 s", "1.67 m/s²"),
    ("60 km/h to rest in 5 s", "3.33 m/s²"),
    ("acceleration 4 m/s", "12 m/s"),
    ("0→6 m/s in the first 2 s, then 6→12", "3 m/s² uniform"),
    ("20 m/s in 10 s, then holds", "2 m/s² in the first phase"),
    ("flat at 10 m/s for the first 5 s", "50 metres"),
    ("straight line from 0 to 6 m/s in 3 s", "2 m/s²"),
    ("15 m/s for 8 s", "120 metres"),
    ("from 20 m/s down to zero in 5 s", "50 metres"),
    ("(0 s, 0 m) to (10 s, 50 m)", "5 m/s"),
    ("0→10 m/s in 2 s, then flat", "40 metres"),
    ("base 10 s on the time axis, height 20 m/s", "100 metres"),
    ("flat at 8 m/s for 6 s — the average speed", "6.4 m/s"),
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
    ("distance 100+100", lambda: 100 + 100 == 200),
    ("3-4-5", lambda: ok((4**2 + 3**2) ** 0.5, 5)),
    ("4E3N dist 7", lambda: 4 + 3 == 7),
    ("half track", lambda: ok(400 / 2, 200)),
    ("127 m disp", lambda: round(400 / math.pi, 2) == 127.32),
    ("5E5W", lambda: 5 + 5 == 10),
    ("8-6-10", lambda: ok((8**2 + 6**2) ** 0.5, 10)),
    ("14-10=4", lambda: 14 - 10 == 4),
    ("5-12-13", lambda: ok((5**2 + 12**2) ** 0.5, 13)),
    ("3-4-500", lambda: ok((300**2 + 400**2) ** 0.5, 500)),
    ("100/20", lambda: ok(100 / 20, 5)),
    ("3km/10min", lambda: ok(3000 / 600, 5)),
    ("5*20", lambda: 5 * 20 == 100),
    ("4.5/.25", lambda: ok(4.5 / 0.25, 18)),
    ("200/25", lambda: ok(200 / 25, 8)),
    ("72->20", lambda: ok(72 * 5 / 18, 20)),
    ("36->10", lambda: ok(36 * 5 / 18, 10)),
    ("90->25", lambda: ok(90 * 5 / 18, 25)),
    ("54->15", lambda: ok(54 * 5 / 18, 15)),
    ("18->5", lambda: ok(18 * 5 / 18, 5)),
    ("avg 40", lambda: ok((60 + 60) / 3, 40)),
    ("hill 24", lambda: ok(120 / 5, 24)),
    ("2.5", lambda: ok(100 / 40, 2.5)),
    ("120km", lambda: 60 * 2 == 120),
    ("40s", lambda: ok(600 / 15, 40)),
    ("300m", lambda: 10 * 30 == 300),
    ("9km/.5h", lambda: ok(9000 / 1800, 5)),
    ("750/7.5", lambda: ok(1.5 * 500, 750) and ok(750 / 100, 7.5)),
    ("1.59", lambda: round(500 / math.pi, 2) == 159.15 and ok(159 / 100, 1.59)),
    ("boat 4", lambda: ok(12 / 3, 4)),
    ("sound", lambda: 340 * 3 == 1020),
    ("10 vs 8", lambda: ok(100 / 10, 10) and ok(200 / 25, 8)),
    ("48m trip", lambda: ok(96 / 12, 8)),
    ("a=2", lambda: ok((20 - 10) / 5, 2)),
    ("16/8", lambda: ok(16 / 8, 2)),
    ("-4", lambda: ok((10 - 30) / 5, -4)),
    ("-2", lambda: ok((15 - 25) / 5, -2)),
    ("10/5", lambda: ok(10 / 5, 2)),
    ("5/5", lambda: ok(5 / 5, 1)),
    ("1.67", lambda: round((15 - 10) / 3, 2) == 1.67),
    ("3.33", lambda: round((60 * 5 / 18) / 5, 2) == 3.33),
    ("4*3", lambda: 4 * 3 == 12),
    ("3 unif", lambda: ok(6 / 2, 3)),
    ("20/10", lambda: ok(20 / 10, 2)),
    ("50", lambda: 10 * 5 == 50),
    ("6/3", lambda: ok(6 / 3, 2)),
    ("120", lambda: 15 * 8 == 120),
    ("tri 50", lambda: ok(0.5 * 5 * 20, 50)),
    ("slope 5", lambda: ok(50 / 10, 5)),
    ("trap 40", lambda: ok(0.5 * 2 * 10 + 10 * 3, 40)),
    ("tri 100", lambda: ok(0.5 * 10 * 20, 100)),
    ("trap 64", lambda: ok(0.5 * 4 * 8 + 8 * 6, 64)),
    ("avg 6.4", lambda: ok(64 / 10, 6.4)),
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
