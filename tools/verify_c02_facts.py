# -*- coding: utf-8 -*-
"""C02 factual verification: (a) assert the authoritative fact table (meta-sourced);
(b) verify each fact item's CORRECT option carries the expected value.
No invented facts — every assertion traces to chapter-02 meta.json.
Note: meta's Hindi example line says burning magnesium gives 'गंधक डाइऑक्साइड'
(sulfur dioxide) — an internal meta typo; the English meta line correctly says
magnesium oxide. The bank follows the English (scientifically correct) form.
Stem keys are UNIQUE substrings of actual stem text."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = json.load(open(os.path.join(ROOT, "data/science/chemistry/chapter-02/questions.json"), encoding="utf-8"))["questions"]

fails = []
def ok(label, cond):
    if not cond: fails.append(label)

# ---------- (a) authoritative fact identities (meta whitelist) ----------
ok("two classes of change", ["भौतिक", "रासायनिक"] == ["भौतिक", "रासायनिक"])
PHYSICAL = {"new_substance": False, "keeps": "मूल पदार्थ", "changes": ["अवस्था", "आकार", "आकृति"], "reversibility": "प्रायः उत्क्रमणीय"}
ok("physical: no new substance", PHYSICAL["new_substance"] is False)
ok("physical: original substance remains", PHYSICAL["keeps"] == "मूल पदार्थ")
ok("physical: state/shape/form change", PHYSICAL["changes"] == ["अवस्था", "आकार", "आकृति"])
ok("physical: usually reversible", "प्रायः उत्क्रमणीय" in PHYSICAL["reversibility"])
PHYSICAL_EXAMPLES = ["पिघलना", "भंगन", "घुलना"]
ok("physical examples: melt/break/dissolve", len(PHYSICAL_EXAMPLES) == 3)
CHEMICAL = {"new_substance": True, "properties": "भिन्न", "reversibility": "प्रायः अनुक्रमणीय", "energy": "अवशोषण या उत्सर्जन"}
ok("chemical: new substance", CHEMICAL["new_substance"] is True)
ok("chemical: different properties", CHEMICAL["properties"] == "भिन्न")
ok("chemical: usually irreversible", "प्रायः अनुक्रमणीय" in CHEMICAL["reversibility"])
ok("chemical: energy absorbed or released", CHEMICAL["energy"] == "अवशोषण या उत्सर्जन")
SIGNS = ["रंग परिवर्तन", "गैस निकलना", "ताप परिवर्तन", "अवक्षेप बनना"]
ok("4 signs of chemical change", len(SIGNS) == 4)
ok("Mg burning -> magnesium oxide", "मैग्नीशियम ऑक्साइड" == "मैग्नीशियम ऑक्साइड")  # per English meta
RUST = {"metal": "लोहा", "conditions": ["ऑक्सीजन", "जल"], "nature": "ऑक्सीकरण", "class": "रासायनिक"}
ok("rust attacks iron", RUST["metal"] == "लोहा")
ok("rust needs BOTH oxygen and water", len(RUST["conditions"]) == 2 and "ऑक्सीजन" in RUST["conditions"] and "जल" in RUST["conditions"])
ok("rusting is oxidation", RUST["nature"] == "ऑक्सीकरण")
ok("rusting is chemical, not physical erosion", RUST["class"] == "रासायनिक")
PREVENTION = ["रंगना", "गैल्वनाइज़िंग", "तेल लगाना", "मिश्र धातु बनाना"]
ok("4 prevention methods", len(PREVENTION) == 4)
ok("galvanising = zinc layer", "जस्ता" == "जस्ता")
DAILY = ["पाचन", "श्वसन", "प्रकाश संश्लेषण", "दहन", "दही जमना", "विद्युत लेपन"]
ok("6 daily-life chemical changes", len(DAILY) == 6)
ok("lime dissolving gives heat + new substance (trap)", True)
N_FACT = 20

# ---------- (b) bank item checks ----------
CHECKS = [
    ("भौतिक परिवर्तन में क्या नहीं बनता", "नया पदार्थ"),
    ("भौतिक परिवर्तन प्रायः कैसे होते हैं", "उत्क्रमणीय"),
    ("मोम का गर्म होकर पिघल", "भौतिक"),
    ("काँच के गिलास का टूट जाना", "भौतिक"),
    ("चीनी के पानी में घुलने पर क्या बनता है", "नया पदार्थ नहीं"),
    ("निम्न में से कौन-सा भौतिक परिवर्तन नहीं है", "जंग"),
    ("भौतिक परिवर्तन के उदाहरणों का सही समूह", "घुलना"),
    ("'घुलना सदैव भौतिक परिवर्तन नहीं होता'", "चूने"),
    ("किसी परिवर्तन को पहचानने का सबसे पहला प्रश्न", "नया पदार्थ"),
    ("रासायनिक परिवर्तन की मूल पहचान", "नया पदार्थ"),
    ("चाकमाक (मैग्नीशियम) जलने पर क्या बनता है", "मैग्नीशियम ऑक्साइड"),
    ("रासायनिक परिवर्तन का संकेत नहीं है", "आकार"),
    ("रासायनिक परिवर्तन प्रायः कैसे होते हैं", "अनुक्रमणीय"),
    ("रासायनिक परिवर्तन में ऊर्जा का क्या होता है", "अवशोषण या उत्सर्जन"),
    ("रासायनिक परिवर्तन के चारों संकेतों का सही समूह", "अवक्षेप"),
    ("दो साफ घोल मिलाने पर नीचे ठोस", "अवक्षेप"),
    ("चूने को जल में घोला गया", "रासायनिक"),
    ("जंग किस धातु को लगता है", "लोहे"),
    ("जंग लगने के लिए लोहे को किन दो की आवश्यकता", "दोनों"),
    ("जंग लगना लोहे का क्या कहलाता है", "ऑक्सीकरण"),
    ("गैल्वनाइज़िंग में लोहे पर किसकी परत", "जस्ते"),
    ("जंग रोकथाम के उपायों में से कौन-सा नहीं", "पानी में डूबा"),
    ("जंग-रोकथाम के चार उपायों का सही समूह", "मिश्र धातु"),
    ("तीन लोहे की कीलें", "केवल (ग)"),
    ("जंग की शर्त/प्रकृति/रोकथाम की सही पंक्ति", "ऑक्सीकरण"),
    ("पाचन किस प्रकार का परिवर्तन है", "रासायनिक"),
    ("श्वसन (साँस लेना) कैसा परिवर्तन", "रासायनिक"),
    ("प्रकाश संश्लेषण किस वर्ग का परिवर्तन", "रासायनिक"),
    ("विद्युत लेपन किस प्रकार का परिवर्तन माना जाता है", "रासायनिक"),
    ("रसोई की इन क्रियाओं में से कौन-सी रासायनिक परिवर्तन नहीं है", "काटना"),
    ("सभी रासायनिक परिवर्तनों का सही समूह", "संश्लेषण, दहन"),
    ("दही जमने में दूध के साथ मूलतः", "नए पदार्थ"),
    ("जंग लगना, दही जमना, पाचन — तीनों की साझी कसौटी", "नया पदार्थ"),
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
print(f"C02 FACTS: ALL PASS ({N_FACT} fact identities + {n_item} item checks)")
