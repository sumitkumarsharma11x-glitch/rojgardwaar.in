const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SUBJECTS = ["biology", "physics", "chemistry"];
const CHAPTERS = Array.from({ length: 12 }, (_, i) => `chapter-${String(i + 1).padStart(2, "0")}`);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function getQuestions(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.questions)) return data.questions;
  return [];
}

function correctIndex(q) {
  return Number.isInteger(q.correctAnswer) ? q.correctAnswer : q.correct;
}

test("all 36 Science chapters have usable bilingual question banks", () => {
  let checked = 0;

  for (const subject of SUBJECTS) {
    for (const chapter of CHAPTERS) {
      const base = path.join("data", "science", subject, chapter);
      const meta = readJson(path.join(base, "meta.json"));
      const questions = getQuestions(readJson(path.join(base, "questions.json")));

      assert.ok(meta.chapterName?.hi && meta.chapterName?.en, `${base}: bilingual chapter title`);
      assert.ok(meta.notes?.hi?.concept && meta.notes?.en?.concept, `${base}: bilingual notes`);
      assert.ok(questions.length >= 150, `${base}: expected at least 150 questions, got ${questions.length}`);

      const ids = new Set();
      const hindiPrompts = new Set();
      const answerCounts = [0, 0, 0, 0];

      for (const [i, q] of questions.entries()) {
        const label = `${base}/questions.json question ${i + 1}`;
        assert.ok(q.id, `${label}: missing id`);
        assert.ok(!ids.has(q.id), `${label}: duplicate id ${q.id}`);
        ids.add(q.id);

        const hiPrompt = q.question?.hi?.trim();
        assert.ok(hiPrompt, `${label}: missing Hindi prompt`);
        assert.ok(q.question?.en?.trim(), `${label}: missing English prompt`);
        assert.ok(!hindiPrompts.has(hiPrompt), `${label}: duplicate Hindi prompt`);
        hindiPrompts.add(hiPrompt);

        assert.ok(Array.isArray(q.options?.hi) && q.options.hi.length === 4, `${label}: expected four Hindi options`);
        assert.ok(Array.isArray(q.options?.en) && q.options.en.length === 4, `${label}: expected four English options`);
        assert.equal(new Set(q.options.hi.map(x => String(x).trim())).size, 4, `${label}: duplicate Hindi options`);
        assert.equal(new Set(q.options.en.map(x => String(x).trim())).size, 4, `${label}: duplicate English options`);

        const answer = correctIndex(q);
        assert.ok(Number.isInteger(answer) && answer >= 0 && answer < 4, `${label}: invalid correct answer index`);
        answerCounts[answer] += 1;

        assert.ok(q.explanation?.hi?.trim(), `${label}: missing Hindi explanation`);
        assert.ok(q.explanation?.en?.trim(), `${label}: missing English explanation`);

        for (const language of ["hi", "en"]) {
          const optionExplanations = q.optionExplanations?.[language];
          if (optionExplanations !== undefined) {
            assert.ok(Array.isArray(optionExplanations) && optionExplanations.length === 4,
              `${label}: ${language} option explanations must align with four options`);
          }
        }
      }

      const spread = Math.max(...answerCounts) - Math.min(...answerCounts);
      assert.ok(spread <= 1,
        `${base}: correct-answer positions are imbalanced (${answerCounts.join(", ")})`);
      checked += 1;
    }
  }

  assert.equal(checked, 36);
});
