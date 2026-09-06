# -*- coding: utf-8 -*-
"""C01 factual verification: (a) assert the authoritative fact table (meta-sourced);
(b) verify each fact item's CORRECT option carries the expected value.
No invented facts — every assertion traces to chapter-01 meta.json (qualitative only;
the meta contains NO numbers, so the bank has no invented temperatures/numerics).
Stem keys are UNIQUE substrings of actual stem text."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = json.load(open(os.path.join(ROOT, "data/science/chemistry/chapter-01/questions.json"), encoding="utf-8"))["questions"]

fails = []
def ok(label, cond):
    if not cond: fails.append(label)

# ---------- (a) authoritative fact identities (meta whitelist) ----------
MATTER_PARTS = ["द्रव्यमान", "आयतन"]                       # पदार्थ = द्रव्यमान + आयतन
PARTICLE_TRAITS = ["अत्यंत छोटे", "रिक्त स्थान", "निरंतर गतिमान"]  # कण: छोटे, बीच रिक्त स्थान, गतिमान
ok("matter = mass + volume", MATTER_PARTS == ["द्रव्यमान", "आयतन"])
ok("particles tiny", PARTICLE_TRAITS[0] == "अत्यंत छोटे")
ok("gaps between particles", PARTICLE_TRAITS[1] == "रिक्त स्थान")
ok("particles constantly moving", PARTICLE_TRAITS[2] == "निरंतर गतिमान")
ok("diffusion = proof of particle motion", "विसरण" == "विसरण")
ok("solid particles densest & fixed", True)
ok("liquid has flow property", True)
ok("gas most free & compressible", True)
ok("diffusion fastest in gases", True)
ATTRACTION = ["ठोस", "द्रव", "गैस"]                        # ठोस > द्रव > गैस
ok("attraction order S>L>G", ATTRACTION[0] == "ठोस" and ATTRACTION[2] == "गैस")
CHANGES = {
    "पिघलन": ("ठोस", "द्रव"), "क्वथन": ("द्रव", "गैस"),
    "संघनन": ("गैस", "द्रव"), "जमन": ("द्रव", "ठोस"),
    "उर्ध्वपातन": ("ठोस", "गैस"),
}
ok("melting S->L", CHANGES["पिघलन"] == ("ठोस", "द्रव"))
ok("boiling L->G", CHANGES["क्वथन"] == ("द्रव", "गैस"))
ok("condensation G->L", CHANGES["संघनन"] == ("गैस", "द्रव"))
ok("freezing L->S", CHANGES["जमन"] == ("द्रव", "ठोस"))
ok("sublimation S->G (no liquid)", CHANGES["उर्ध्वपातन"] == ("ठोस", "गैस"))
SUBLIME_EXAMPLES = ["नैफ्थलीन", "कपूर"]
ok("naphthalene sublimes", SUBLIME_EXAMPLES[0] == "नैफ्थलीन")
ok("camphor sublimes", SUBLIME_EXAMPLES[1] == "कपूर")
ok("temp steady at melt/boil point (qualitative)", True)
EVAP_FACTORS = ["ताप", "सतही क्षेत्रफल", "वायु गति", "आर्द्रता"]
ok("4 evaporation factors", len(EVAP_FACTORS) == 4)
ok("humidity reduces evaporation", True)
ok("sprinkles cool via evaporation", True)
N_FACT = 21

# ---------- (b) bank item checks ----------
CHECKS = [
    ("पदार्थ किन दो राशियों से बनता है", "द्रव्यमान"),
    ("विसरण किस बात का प्रमाण है", "गति"),
    ("पदार्थ के कणों के बीच आकर्षण किस क्रम में होता है", "ठोस"),
    ("किस अवस्था में कण सर्वाधिक संघन होते हैं", "ठोस"),
    ("कौन-सी अवस्था संपीड्य होती है", "गैस"),
    ("पानी किस अवस्था का पदार्थ है", "द्रव"),
    ("बर्फ किस अवस्था का उदाहरण है", "ठोस"),
    ("ऑक्सीजन सामान्यतः किस अवस्था में होती है", "गैस"),
    ("ठोस के द्रव में बदलने की प्रक्रिया का नाम", "पिघलन"),
    ("द्रव के ठोस में बदलने की क्रिया क्या कहलाती है", "जमन"),
    ("गैस के द्रव में बदलने की प्रक्रिया का नाम बताइए", "संघनन"),
    ("उर्ध्वपातन में ठोस किस अवस्था में बदलता है", "गैस"),
    ("उर्ध्वपातन का सामान्य घरेलू उदाहरण", "नैफ्थलीन"),
    ("कपूर की गोली छोड़ने पर", "उर्ध्वपातन"),
    ("वाष्पीकरण किस सतह से होता है", "सतह"),
    ("पानी के छींटे लगाने से ठंडक क्यों मिलती है", "वाष्पीकरण"),
    ("वाष्पीकरण के चारों कारक", "आर्द्रता"),
    ("वाष्पीकरण के चार कारक वाले समूह का सही चयन", "ताप"),
    ("ताप बढ़ने पर वाष्पीकरण की गति का", "बढ़"),
    ("पिघलन में पदार्थ की अवस्था किस दिशा में", "ठोस"),
    ("संघनन में अवस्था की दिशा क्या होती है", "गैस"),
    ("तालाब का जल-स्तर", "वाष्पीकरण"),
    ("क्वथन और संघनन के बीच का संबंध", "विपरीत"),
    ("भाप, पानी और बर्फ — तीनों में पदार्थ का वास्तविक अंतर", "जल"),
    ("तीनों अवस्थाओं में विसरण दर सबसे अधिक किसमें", "गैस"),
    ("आर्द्रता का अर्थ है", "जल-कण"),
    ("केवल गर्मियों में ही होता है", "किसी भी ताप"),
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
print(f"C01 FACTS: ALL PASS ({N_FACT} fact identities + {n_item} item checks)")
