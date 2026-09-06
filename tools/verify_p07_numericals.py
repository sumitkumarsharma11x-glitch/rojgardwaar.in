import json, math, sys

qs = json.load(open("data/science/physics/chapter-07/questions.json", encoding="utf-8"))["questions"]
CHECKS = [
    # ---- T1 ----
    ("makes 600 oscillations in 2 seconds", "300 Hz"),
    ("50 Hz source completes how many oscillations in 4 s", "200"),
    ("wings beat 400 times per second", "400 Hz"),
    ("string vibrates 100 times per second", "100 Hz"),
    ("A frequency of 500 Hz means", "500 vibrations per second"),
    # ---- T2 ----
    ("how far does it travel in 5 s", "1720 m"),
    ("cover 1032 m is", "3 s"),
    ("thunder arrived 3 s later", "1032 m"),
    ("A sound covering 688 m in 2 s", "344 m/s"),
    ("from a cliff 1.72 km away returns in 10 s", "344 m/s"),
    ("A sound wave covering 1720 m in 5 s", "344 m/s"),
    ("roughly how late does a voice from 1 km arrive", "About 3 seconds"),
    ("cross a 2.56 km rail is", "0.5 s"),
    # ---- T3 ----
    ("time period of a 50 Hz sound", "0.02 s"),
    ("time period of a 100 Hz frequency", "0.01 s"),
    ("time period of a 500 Hz sound", "0.002 s"),
    ("time period is 0.005 s", "200 Hz"),
    ("frequency 100 Hz — the wavelength is", "3.4 m"),
    ("v = 344 m/s, ν = 172 Hz", "2 m"),
    ("Wavelength 0.68 m and speed 340 m/s", "500 Hz"),
    ("Wavelength 2 m and frequency 170 Hz", "340 m/s"),
    ("λ = 0.5 m, ν = 680 Hz", "340 m/s"),
    ("time period 0.01 s — the wavelength is", "3.4 m"),
    ("wavelength of a 2 kHz wave is", "0.17 m"),
    ("wavelength in water is", "1.5 m"),
    ("plays for 4 s — the total oscillations", "1000"),
    ("Which of these sounds is ultrasonic", "30,000 Hz"),
    ("Which of these sounds is infrasonic", "10 Hz"),
    ("A 15,000 Hz sound is", "Audible"),
    # ---- T4 ----
    ("minimum distance from the reflector is about", "17.2 m"),
    ("after how many seconds does the echo arrive", "2 s"),
    ("A clap 86 m from a wall", "0.5 s"),
    ("returns in 1 s (v = 344 m/s)", "172 m"),
    ("returns in 4 s (v = 344)", "688 m"),
    ("returns in 4 s (v = 1500 m/s in water)", "3000 m"),
    ("A SONAR pulse returns in 2 s (v = 1500)", "1500 m"),
    ("shoal's pulse back in 3 s (v = 1500)", "2250 m"),
    ("echo arrives after 5 s (v = 344)", "860 m"),
    ("clapping once per second", "Hears the echo with each clap (the 344 m round trip takes 1 s)"),
    ("Reflector at 34.4 m", "0.2 s"),
    ("hears the echo 0.5 s later", "86 m"),
    ("minimum time gap between two sounds", "0.1 s"),
    ("reasoning behind the 17.2 m minimum", "0.1 s gap × 344 m/s ÷ 2"),
    ("Speed of sound in air (room temperature)", "344 m/s"),
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
    ("600/2", lambda: ok(600/2, 300)),
    ("50x4", lambda: ok(50*4, 200)),
    ("344x5", lambda: ok(344*5, 1720)),
    ("1032/344", lambda: ok(1032/344, 3)),
    ("344x3", lambda: ok(344*3, 1032)),
    ("688/2", lambda: ok(688/2, 344)),
    ("2x1720/10", lambda: ok(2*1720/10, 344)),
    ("1720/5", lambda: ok(1720/5, 344)),
    ("1000/344~2.9", lambda: abs(1000/344 - 2.9) < 0.05),
    ("2560/5120", lambda: ok(2560/5120, 0.5)),
    ("1/50", lambda: ok(1/50, 0.02)),
    ("1/100", lambda: ok(1/100, 0.01)),
    ("1/500", lambda: ok(1/500, 0.002)),
    ("1/0.005", lambda: ok(1/0.005, 200)),
    ("340/100", lambda: ok(340/100, 3.4)),
    ("344/172", lambda: ok(344/172, 2)),
    ("340/0.68", lambda: ok(340/0.68, 500)),
    ("2x170", lambda: ok(2*170, 340)),
    ("0.5x680", lambda: ok(0.5*680, 340)),
    ("340x0.01", lambda: ok(340*0.01, 3.4)),
    ("340/2000", lambda: ok(340/2000, 0.17)),
    ("1500/1000", lambda: ok(1500/1000, 1.5)),
    ("250x4", lambda: ok(250*4, 1000)),
    ("echo min 17.2", lambda: ok(344*0.1/2, 17.2)),
    ("2x344/344", lambda: ok(2*344/344, 2)),
    ("2x86/344", lambda: ok(2*86/344, 0.5)),
    ("344x1/2", lambda: ok(344*1/2, 172)),
    ("344x4/2", lambda: ok(344*4/2, 688)),
    ("1500x4/2", lambda: ok(1500*4/2, 3000)),
    ("1500x2/2", lambda: ok(1500*2/2, 1500)),
    ("1500x3/2", lambda: ok(1500*3/2, 2250)),
    ("344x5/2", lambda: ok(344*5/2, 860)),
    ("2x172/344", lambda: ok(2*172/344, 1)),
    ("68.8/344", lambda: ok(2*34.4/344, 0.2)),
    ("344x0.5/2", lambda: ok(344*0.5/2, 86)),
    ("ultra 30k>20k", lambda: 30000 > 20000),
    ("infra 10<20", lambda: 10 < 20),
    ("audible 20<15000<20000", lambda: 20 < 15000 < 20000),
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
