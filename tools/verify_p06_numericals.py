import json, math, sys

qs = json.load(open("data/science/physics/chapter-06/questions.json", encoding="utf-8"))["questions"]
CHECKS = [
    # ---- T1 conversions & Q=mcΔT ----
    ("One calorie is about how many joules", "4.2 joules"),
    ("27 °C in kelvin is", "300 K"),
    ("30 °C = ? K", "303 K"),
    ("50 °C in kelvin is", "323 K"),
    ("373 K in Celsius is", "100 °C"),
    ("300 K in Celsius is", "27 °C"),
    ("−40 °C in kelvin is", "233 K"),
    ("from 40 °C to 60 °C", "2000 cal"),
    ("Raising 50 g of water from 20 °C to 45 °C", "1250 cal"),
    ("from 30 °C to 80 °C", "10,000 cal"),
    # ---- T3 latent heat ----
    ("melt 10 g of ice", "800 cal"),
    ("melt 20 g of ice", "1600 cal"),
    ("5 g of water fully into steam", "2700 cal"),
    ("10 g of steam condenses", "5400 cal"),
    ("50 g of water at 100 °C fully vaporises", "27,000 cal"),
    ("melt 1 kg of ice", "80,000 cal"),
    ("warm 2 kg of water from 30 °C to 100 °C", "140,000 cal"),
    ("melt 40 g of ice at 0 °C and then warm", "4800 cal"),
    ("25 g of water at 100 °C turns to steam", "13,500 cal"),
    # latent values as facts
    ("latent heat of melting of ice", "80 cal/g"),
    ("latent heat of vaporisation of water", "540 cal/g"),
    ("melting point of ice (at normal pressure)", "0 °C"),
    ("boiling point of water at normal pressure", "100 °C"),
    ("normal temperature of a healthy human body", "37 °C"),
    ("On the Kelvin scale, the boiling point of water", "373 K"),
    ("On the Kelvin scale, the melting point of ice", "273 K"),
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
    ("1cal=4.2J", lambda: ok(4.186, 4.2) is False or True),  # relation check below
    ("27+273", lambda: ok(27 + 273, 300)),
    ("30+273", lambda: ok(30 + 273, 303)),
    ("50+273", lambda: ok(50 + 273, 323)),
    ("373-273", lambda: ok(373 - 273, 100)),
    ("300-273", lambda: ok(300 - 273, 27)),
    ("-40+273", lambda: ok(-40 + 273, 233)),
    ("100g x20deg", lambda: ok(100 * 1 * 20, 2000)),
    ("50g x25deg", lambda: ok(50 * 1 * 25, 1250)),
    ("200g x50deg", lambda: ok(200 * 1 * 50, 10000)),
    ("10x80", lambda: ok(10 * 80, 800)),
    ("20x80", lambda: ok(20 * 80, 1600)),
    ("5x540", lambda: ok(5 * 540, 2700)),
    ("10x540", lambda: ok(10 * 540, 5400)),
    ("50x540", lambda: ok(50 * 540, 27000)),
    ("1000x80", lambda: ok(1000 * 80, 80000)),
    ("2000x70", lambda: ok(2000 * 1 * 70, 140000)),
    ("40x80+40x40", lambda: ok(40 * 80 + 40 * 1 * 40, 4800)),
    ("25x540", lambda: ok(25 * 540, 13500)),
    ("steam extra vs ice extra", lambda: ok(540 - 80, 460)),
    ("1cal->J approx", lambda: abs(4.186 - 4.2) < 0.05),
]
del IDENT[0]  # drop placeholder
for name, fn in IDENT:
    try:
        if not fn():
            fails.append("IDENTITY FAIL: " + name)
    except Exception as e:
        fails.append("IDENTITY ERR %s: %s" % (name, e))

print("checked %d numerical/fact items + %d arithmetic identities" % (len(CHECKS), len(IDENT)))
print("NUMERICAL VERIFICATION:", "ALL PASS" if not fails else "FAILURES:")
for f in fails:
    print("  -", f)
sys.exit(1 if fails else 0)
