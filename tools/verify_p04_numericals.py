import json, math, sys

qs = json.load(open("data/science/physics/chapter-04/questions.json", encoding="utf-8"))["questions"]
CHECKS = [
    # ---- T1 gravitation-law ----
    ("distance between two objects is doubled", "One-fourth"),
    ("One object's mass is doubled", "Doubles"),
    ("Both objects' masses are doubled", "four times"),
    ("distance between two objects is halved", "four times"),
    ("A's mass is doubled and the distance too", "F/2"),
    ("first 1 m apart and then 3 m apart", "One-ninth"),
    ("is tripled, the gravitational force", "F/9"),
    ("The force between two objects is 10 N", "40 N"),
    ("at what distance does it become F/4", "2d"),
    ("One ball's mass is tripled and the distance too", "F/3"),
    # ---- T2 gravity-and-weight ----
    ("weight of a 5 kg object on the earth", "49 N"),
    ("The weight of a 10 kg object", "98 N"),
    ("The weight of a 20 kg object", "196 N"),
    ("The weight of a 50 kg person", "490 N"),
    ("60 kg passenger on the moon", "98 N"),
    ("An object weighs 98 N", "10 kg"),
    ("weighing 49 N", "5 kg"),
    ("weighing 29.4 N", "3 kg"),
    ("weighs 60 N on the earth", "10 N"),
    ("mass of 30 kg — on the moon", "Still 30 kg"),
    ("g = 20 m/s²", "100 N"),
    ("weighs 16.3 N on the moon", "98 N"),
    ("weight of a 1 kg object", "9.8 N"),
    # ---- T3 pressure ----
    ("acts on an area of 4 m²", "50 Pa"),
    ("A 500 N force on a 5 m² area", "100 Pa"),
    ("acts on 0.2 m²", "300 Pa"),
    ("400 Pa over an area of 0.5 m²", "200 N"),
    ("produces a pressure of 1000 Pa", "0.5 m²"),
    ("acts on 0.25 m²", "1000 Pa"),
    ("Pressure 200 Pa over an area of 4 m²", "800 N"),
    ("first on 2 m² then on 0.5 m²", "1 : 4"),
    ("areas of 1 m² and 5 m²", "5 : 1"),
    ("depths of 2 m and 6 m", "1 : 3"),
    ("person A (500 N) stands on 0.01 m²", "A (50,000 Pa"),
    ("the water depth is tripled", "three times"),
    ("halve the area", "Doubles"),
    # ---- T4 buoyancy ----
    ("weighs 50 N in air but 30 N", "20 N"),
    ("100 N in air, 80 N in water", "20 N"),
    ("A floating object weighs 200 N", "200 N"),
    ("feels 400 N", "100 N"),
    ("weight is 20 N and the buoyant force 12 N", "8 N downwards"),
    ("Weight 20 N, buoyant force 25 N", "5 N upward"),
    ("displaced fluid weighs 20 N", "20 N"),
    ("49 N in air, 39.2 N in water", "1 kg"),
    ("A floating object weighs 50 N", "50 N"),
    ("Among objects of density 0.8", "0.8 g/cm³ one"),
    ("1/3 immersed in water", "2/3 immersed"),
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
    ("r x2 -> F/4", lambda: ok(1 / 2**2, 0.25)),
    ("m x2 -> 2F", lambda: ok(2 * 1, 2)),
    ("both x2 -> 4F", lambda: ok(2 * 2, 4)),
    ("r /2 -> 4F", lambda: ok(1 / (0.5**2), 4)),
    ("2m,d -> m,2d: F/8", lambda: ok((1 * 1 / (2**2)) / (1 * 2 / 1), 1 / 8.0)),
    ("1m -> 3m: F/9", lambda: ok(1 / 3**2, 1 / 9.0)),
    ("10N r/2 -> 40", lambda: ok(10 * 4, 40)),
    ("F/4 needs 2d", lambda: ok(1 / 2**2, 1 / 4.0)),
    ("3m,3r -> F/3", lambda: ok((3 / 3**2), 1 / 3.0)),
    ("5 x 9.8", lambda: ok(5 * 9.8, 49)),
    ("10 x 9.8", lambda: ok(10 * 9.8, 98)),
    ("20 x 9.8", lambda: ok(20 * 9.8, 196)),
    ("50 x 9.8", lambda: ok(50 * 9.8, 490)),
    ("60 x 9.8/6", lambda: ok(60 * 9.8 / 6, 98)),
    ("98/9.8", lambda: ok(98 / 9.8, 10)),
    ("49/9.8", lambda: ok(49 / 9.8, 5)),
    ("29.4/9.8", lambda: ok(29.4 / 9.8, 3)),
    ("60/6", lambda: ok(60 / 6, 10)),
    ("5 x 20", lambda: ok(5 * 20, 100)),
    ("16.3 x 6", lambda: ok(16.3 * 6, 97.8)),
    ("1 x 9.8", lambda: ok(1 * 9.8, 9.8)),
    ("200/4", lambda: ok(200 / 4, 50)),
    ("500/5", lambda: ok(500 / 5, 100)),
    ("60/0.2", lambda: ok(60 / 0.2, 300)),
    ("400x0.5", lambda: ok(400 * 0.5, 200)),
    ("500/1000", lambda: ok(500 / 1000, 0.5)),
    ("250/0.25", lambda: ok(250 / 0.25, 1000)),
    ("200x4", lambda: ok(200 * 4, 800)),
    ("600/2 vs 600/0.5", lambda: ok((600 / 2) / (600 / 0.5), 1 / 4.0)),
    ("1/1 vs 1/5 -> 5:1", lambda: ok((1 / 1) / (1 / 5), 5)),
    ("2:6 -> 1:3", lambda: ok(2 / 6, 1 / 3.0)),
    ("500/0.01 vs 1000/0.1", lambda: ok(500 / 0.01, 50000) and ok(1000 / 0.1, 10000)),
    ("h x3 -> P x3", lambda: ok(3, 3)),
    ("50-30", lambda: ok(50 - 30, 20)),
    ("100-80", lambda: ok(100 - 80, 20)),
    ("500-400", lambda: ok(500 - 400, 100)),
    ("20-12", lambda: ok(20 - 12, 8)),
    ("25-20", lambda: ok(25 - 20, 5)),
    ("49-39.2", lambda: ok(49 - 39.2, 9.8) and ok(9.8 / 9.8, 1)),
    ("0.8<1.0 float", lambda: 0.8 < 1.0 and 1.2 > 1.0 and 2.5 > 1.0 and 3.0 > 1.0),
    ("half rho -> 2/3 immersed", lambda: ok((1 / 3.0) * 2, 2 / 3.0)),
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
