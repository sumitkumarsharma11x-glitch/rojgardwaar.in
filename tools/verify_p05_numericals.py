import json, math, sys

qs = json.load(open("data/science/physics/chapter-05/questions.json", encoding="utf-8"))["questions"]
CHECKS = [
    # ---- T1 work ----
    ("A 10 N force moves an object 5 metres", "50 J"),
    ("A 20 N force, 3 metres", "60 J"),
    ("A 25 N force acts over 4 metres", "100 J"),
    ("An 8 N force produces a 2 m displacement", "16 J"),
    ("A 6 N force gives a 0.5 m displacement", "3 J"),
    ("moved 6 m by a 12 N force", "72 J"),
    ("100 J of work is done over a 5 m displacement", "20 N"),
    ("60 J of work is done by a 20 N force", "3 m"),
    ("40 J of work over an 8 m displacement", "5 N"),
    ("performing 80 J of work", "5 m"),
    ("never moves", "Zero"),
    ("double the displacement — the work", "Doubles"),
    ("Halve the force over the same displacement", "Halves"),
    ("500 N force acts on a cart for 20 metres", "10,000 J (10 kJ)"),
    ("frictional force opposes a 2 m displacement", "−100 J"),
    ("30 N forward force and 10 N backward friction", "80 J"),
    ("carries a 100 N load on his head", "Zero (the force is vertical"),
    ("points downward while the object moves 5 m up", "−100 J"),
    ("force is doubled and the displacement halved", "Stays the same"),
    ("0.4 kJ of work is done over an 8 m displacement", "50 N"),
    ("moves an object 1 metre", "1 joule"),
    ("At most how much work can 1 joule", "1 joule"),
    # ---- T2 kinetic energy ----
    ("A 2 kg object moves at 5 m/s", "25 J"),
    ("A 4 kg object at 3 m/s", "18 J"),
    ("A 1 kg stone is thrown at 10 m/s", "50 J"),
    ("A 6 kg ball rolls at 2 m/s", "12 J"),
    ("A 10 kg bicycle at 4 m/s", "80 J"),
    ("A 0.5 kg ball flies at 8 m/s", "16 J"),
    ("speed rises from 5 m/s to 10 m/s", "100 J"),
    ("Mass doubled (same velocity)", "Doubles"),
    ("kinetic energy is 200 J at 10 m/s", "4 kg"),
    ("A 0.2 kg bullet at 20 m/s", "40 J"),
    ("A 3 kg object runs at 4 m/s", "24 J"),
    ("A 5 kg ball at 6 m/s", "90 J"),
    ("Triple the velocity", "nine times"),
    ("its speed is raised to 10 m/s", "150 J"),
    ("Halve the mass and double the velocity", "Doubles"),
    ("halving its velocity", "25 J"),
    ("has 800 J of kinetic energy", "8 m/s"),
    ("masses 1 kg and 4 kg", "2 : 1"),
    ("speeds 2 m/s and 4 m/s", "1 : 4"),
    ("Keeping the mass fixed, double the velocity", "four times"),
    # ---- T3 PE & conservation ----
    ("at a height of 2 m (g = 10", "100 J"),
    ("at 5 m height (g = 9.8", "490 J"),
    ("A 2 kg object at 3 m", "58.8 J"),
    ("A 20 kg bag at 1.5 m height", "300 J"),
    ("196 J at a height of 4 m", "5 kg"),
    ("600 J with mass 15 kg", "4 m"),
    ("falls freely from 5 m", "100 J"),
    ("A 0.5 kg ball is at 4 m height", "20 J"),
    ("dropped freely from 10 m", "14.14 m/s"),
    ("A 3 kg object falls from 10 m", "300 J"),
    ("Double the height (same mass)", "Doubles"),
    ("Halve the mass (same height)", "Halves"),
    ("Double the mass and halve the height", "Stays the same"),
    # ---- T4 power ----
    ("100 J of work in 5 seconds", "20 W"),
    ("1000 J of work in 10 s", "100 W"),
    ("500 J of work in 50 s", "10 W"),
    ("600 J of work in 20 s", "30 W"),
    ("750 J of work in 15 s", "50 W"),
    ("300 J of work in 1 minute", "5 W"),
    ("Work done at 50 W for 10 s", "500 J"),
    ("A 200 W machine runs for 5 s", "1000 J"),
    ("400 J of work at 40 W", "10 s"),
    ("2 kW machine works for 10 s", "20,000 J"),
    ("burns for 1 hour", "360,000 J"),
    ("A does 500 J in 10 s, B does 500 J in 20 s", "2 : 1"),
    ("A 60 W fan runs for 2 minutes", "7200 J"),
    ("50 kg person climbs a 4 m staircase", "200 W"),
    ("A 60 kg person ascends 5 m in 20 s", "150 W"),
    ("does 18,000 J of work in 1 minute", "300 W"),
    ("A 400 W machine works for 5 minutes", "120,000 J (120 kJ)"),
    ("does 500 J in 5 s, machine B does 1500 J", "Equal (both 100 W)"),
    ("How much energy does a 100 W bulb consume in 1 second", "100 J"),
    ("How many watts make 1 kilowatt", "1000 W"),
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
    ("W 10x5", lambda: ok(10*5, 50)), ("W 20x3", lambda: ok(20*3, 60)),
    ("W 25x4", lambda: ok(25*4, 100)), ("W 8x2", lambda: ok(8*2, 16)),
    ("W 6x0.5", lambda: ok(6*0.5, 3)), ("W 12x6", lambda: ok(12*6, 72)),
    ("F=100/5", lambda: ok(100/5, 20)), ("s=60/20", lambda: ok(60/20, 3)),
    ("F=40/8", lambda: ok(40/8, 5)), ("s=80/16", lambda: ok(80/16, 5)),
    ("W 500x20", lambda: ok(500*20, 10000)), ("friction -100", lambda: ok(-50*2, -100)),
    ("net 20x4", lambda: ok((30-10)*4, 80)), ("up -100", lambda: ok(-20*5, -100)),
    ("2F x s/2", lambda: ok(2*5*(10/2), 5*10)), ("F=400/8", lambda: ok(400/8, 50)),
    ("KE 0.5*2*25", lambda: ok(0.5*2*25, 25)), ("KE 0.5*4*9", lambda: ok(0.5*4*9, 18)),
    ("KE 0.5*1*100", lambda: ok(0.5*1*100, 50)), ("KE 0.5*6*4", lambda: ok(0.5*6*4, 12)),
    ("KE 0.5*10*16", lambda: ok(0.5*10*16, 80)), ("KE 0.5*0.5*64", lambda: ok(0.5*0.5*64, 16)),
    ("KE new 0.5*2*100", lambda: ok(0.5*2*100, 100)), ("m=400/100", lambda: ok(2*200/100, 4)),
    ("KE 0.5*0.2*400", lambda: ok(0.5*0.2*400, 40)), ("KE 0.5*3*16", lambda: ok(0.5*3*16, 24)),
    ("KE 0.5*5*36", lambda: ok(0.5*5*36, 90)), ("v x3 -> 9x", lambda: ok(3**2, 9)),
    ("gain 200-50", lambda: ok(0.5*4*100 - 0.5*4*25, 150)),
    ("m/2 2v -> 2x", lambda: ok(0.5*(4/2)*(2*5)**2, 2*0.5*4*25)),
    ("half v -> 25", lambda: ok(100/4, 25)), ("v=sqrt(1600/25)", lambda: ok(math.sqrt(2*800/25), 8)),
    ("v ratio 2:1", lambda: ok(math.sqrt(4/1), 2)), ("2:4 -> 1:4", lambda: ok(4/16, 0.25)),
    ("PE 5*10*2", lambda: ok(5*10*2, 100)), ("PE 10*9.8*5", lambda: ok(10*9.8*5, 490)),
    ("PE 2*9.8*3", lambda: ok(2*9.8*3, 58.8)), ("PE 20*10*1.5", lambda: ok(20*10*1.5, 300)),
    ("m=196/39.2", lambda: ok(196/(9.8*4), 5)), ("h=600/150", lambda: ok(600/(15*10), 4)),
    ("fall KE=100", lambda: ok(2*10*5, 100)), ("PE 0.5*10*4", lambda: ok(0.5*10*4, 20)),
    ("v=sqrt200", lambda: abs(math.sqrt(2*10*10) - 14.142135) < 1e-5),
    ("KE ground 300", lambda: ok(3*10*10, 300)),
    ("2m h/2 -> same", lambda: ok((2*5)*10*(2/2), 5*10*2)),
    ("P 100/5", lambda: ok(100/5, 20)), ("P 1000/10", lambda: ok(1000/10, 100)),
    ("P 500/50", lambda: ok(500/50, 10)), ("P 600/20", lambda: ok(600/20, 30)),
    ("P 750/15", lambda: ok(750/15, 50)), ("P 300/60", lambda: ok(300/60, 5)),
    ("W 50x10", lambda: ok(50*10, 500)), ("W 200x5", lambda: ok(200*5, 1000)),
    ("t 400/40", lambda: ok(400/40, 10)), ("W 2000x10", lambda: ok(2000*10, 20000)),
    ("E 100x3600", lambda: ok(100*3600, 360000)),
    ("ratio 50:25", lambda: ok((500/10)/(500/20), 2)),
    ("E 60x120", lambda: ok(60*120, 7200)),
    ("stairs 2000/10", lambda: ok(50*10*4/10, 200)),
    ("ascend 3000/20", lambda: ok(60*10*5/20, 150)),
    ("engine 18000/60", lambda: ok(18000/60, 300)),
    ("E 400x300", lambda: ok(400*300, 120000)),
    ("both 100W", lambda: ok(500/5, 100) and ok(1500/15, 100)),
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
