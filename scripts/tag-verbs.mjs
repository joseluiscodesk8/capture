import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scanSentences } from "../src/lib/reading-blocks.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readingsPath = join(root, "src", "data", "readings.json");
const catalogPath = join(root, "src", "data", "verb-catalog.json");
const outDir = join(root, "public", "data");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const ONLY = flag("only", null);

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const LEMMAS = catalog.lemmas;
const IRREGULAR_PAST = catalog.irregularPast;
const DOUBLE_CONSONANT = new Set(catalog.doubleConsonant);
const SKIP_SURFACES = new Set(catalog.skipSurfaces);

function thirdPerson(base) {
  if (/(s|sh|ch|x|z|o)$/.test(base)) return `${base}es`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ies`;
  return `${base}s`;
}

function regularPast(base) {
  if (/e$/.test(base)) return `${base}d`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ied`;
  if (
    DOUBLE_CONSONANT.has(base) &&
    /[^aeiou][aeiou][^aeiouwxy]$/.test(base)
  ) {
    return `${base}${base[base.length - 1]}ed`;
  }
  return `${base}ed`;
}

const BE_PRESENT = new Set(["am", "is", "are"]);
const BE_PAST = new Set(["was", "were"]);
const MODALS = new Set([
  "can",
  "could",
  "may",
  "might",
  "must",
  "shall",
  "should",
  "will",
  "would",
]);

const CONTRACTIONS = {
  "aren't": "are not",
  "can't": "can not",
  "couldn't": "could not",
  "didn't": "did not",
  "doesn't": "does not",
  "don't": "do not",
  "hadn't": "had not",
  "hasn't": "has not",
  "haven't": "have not",
  "isn't": "is not",
  "shouldn't": "should not",
  "wasn't": "was not",
  "weren't": "were not",
  "won't": "will not",
  "wouldn't": "would not",
};

const AUX = new Set(["do", "does", "did", "am", "is", "are", "was", "were"]);
const SPACED_AUX = new Set(["do", "does", "did"]);
const NEGATORS = new Set(["not", "never"]);


const FORM_INDEX = new Map();
for (const lemma of LEMMAS) {
  for (const [form, kind] of [
    [lemma, "base"],
    [thirdPerson(lemma), "third"],
    [IRREGULAR_PAST[lemma] ?? regularPast(lemma), "past"],
  ]) {
    if (SKIP_SURFACES.has(form)) continue;
    if (!FORM_INDEX.has(form)) FORM_INDEX.set(form, []);
    FORM_INDEX.get(form).push({ lemma, kind });
  }
}

function tokenize(text) {
  const bounds = scanSentences(text).map((sentence) => [
    sentence.start,
    sentence.end,
  ]);
  const tokens = [];
  const pattern = /[A-Za-z]+(?:'[A-Za-z]+)*/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const surface = match[0];
    const lower = surface.toLowerCase();
    const expanded = CONTRACTIONS[lower];
    const from = match.index;
    const to = from + surface.length;
    const sentence = bounds.find(([a, b]) => from >= a && to <= b);
    const before = text.slice(
      tokens.length > 0 ? tokens[tokens.length - 1].end : 0,
      from
    );

    tokens.push({
      surface,
      lower,
      start: from,
      end: to,
      sentenceStart: sentence ? sentence[0] : 0,
      clauseBreak: /[,;:]/.test(before),
      expanded: expanded ?? null,
      negated: expanded ? expanded.includes(" not") : false,
    });
  }

  return tokens;
}

function followsModal(tokens, index) {
  const from = tokens[index].sentenceStart;

  for (let i = index - 1; i >= 0; i -= 1) {
    if (tokens[i].start < from) return false;
    if (tokens[i].clauseBreak) return false;
    if (MODALS.has(tokens[i].lower)) return true;
  }

  return false;
}

function isInfinitiveOrParticiple(tokens, index) {
  const previous = tokens[index - 1];

  if (previous) {
    if (previous.lower === "to") return true;
    if (MODALS.has(previous.lower)) return true;
  }

  if (followsModal(tokens, index)) return true;

  return tokens[index].lower.endsWith("ing");
}

function tagReading(reading) {
  const tokens = tokenize(reading.text);
  const consumed = new Set();
  const spans = [];
  const tense = reading.tense;

  const pushSpan = (from, to, lemma) => {
    const first = tokens[from];
    const last = tokens[to];
    spans.push({ from: first.start, to: last.end, tense, lemma });
  };

  const lemmaOf = (token) => {
    if (AUX.has(token.lower)) {
      if (BE_PRESENT.has(token.lower) || BE_PAST.has(token.lower)) return "be";
      return "do";
    }

    const entries = FORM_INDEX.get(token.lower) ?? [];
    const wanted = tense === "past" ? "past" : null;
    const match =
      entries.find((entry) => entry.kind === wanted) ??
      entries.find((entry) => entry.kind === "base") ??
      entries.find((entry) => entry.kind === "third") ??
      entries[0];

    return match ? match.lemma : null;
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (consumed.has(i)) continue;

    const negated =
      token.negated ||
      (token.expanded !== null && token.expanded.endsWith(" not"));
    const aux = negated ? token.expanded.split(" ")[0] : null;

    if (aux && AUX.has(aux)) {
      const next = tokens[i + 1];
      const candidates = next ? FORM_INDEX.get(next.lower) ?? [] : [];
      const usable = candidates.filter(
        (entry) =>
          entry.kind === "base" || (tense === "past" && entry.kind === "past")
      );

      if (next && usable.length > 0) {
        consumed.add(i);
        consumed.add(i + 1);
        pushSpan(i, i + 1, lemmaOf(next));
        i += 1;
        continue;
      }
    }

    if (isInfinitiveOrParticiple(tokens, i)) continue;
    if (SKIP_SURFACES.has(token.lower)) continue;

    if (SPACED_AUX.has(token.lower)) {
      const negator = tokens[i + 1];
      const verb = tokens[i + 2];
      const entries = verb ? FORM_INDEX.get(verb.lower) ?? [] : [];
      const usable = entries.filter(
        (entry) =>
          entry.kind === "base" || (tense === "past" && entry.kind === "past")
      );

      if (negator && verb && NEGATORS.has(negator.lower) && usable.length > 0) {
        consumed.add(i);
        consumed.add(i + 1);
        consumed.add(i + 2);
        pushSpan(i, i + 2, lemmaOf(verb));
        i += 2;
        continue;
      }
    }

    const beForm =
      tense === "past"
        ? BE_PAST.has(token.lower)
        : BE_PRESENT.has(token.lower);

    const previousLower = tokens[i - 1]?.lower ?? "";
    const afterBe =
      tense === "past"
        ? BE_PAST.has(previousLower)
        : BE_PRESENT.has(previousLower);

    const candidates = FORM_INDEX.get(token.lower) ?? [];
    const matches =
      beForm ||
      (tense === "past"
        ? candidates.some((entry) => entry.kind === "past") && !afterBe
        : candidates.length > 0);

    if (!matches) continue;

    let from = i;
    let to = i;

    const previous = tokens[i - 1];
    if (
      previous &&
      !consumed.has(i - 1) &&
      (NEGATORS.has(previous.lower) || previous.negated)
    ) {
      from = i - 1;
      consumed.add(i - 1);
    }

    const next = tokens[i + 1];
    if (next && !consumed.has(i + 1) && NEGATORS.has(next.lower)) {
      to = i + 1;
      consumed.add(i + 1);
    }

    consumed.add(i);
    pushSpan(from, to, lemmaOf(token));
  }

  spans.sort((a, b) => a.from - b.from);

  const merged = [];
  for (const span of spans) {
    const last = merged[merged.length - 1];
    if (last && span.from <= last.to) {
      last.to = Math.max(last.to, span.to);
      continue;
    }
    merged.push({ ...span });
  }

  return merged.map((span) => ({
    ...span,
    surface: reading.text.slice(span.from, span.to),
  }));
}

const { readings } = JSON.parse(readFileSync(readingsPath, "utf8"));
const targets = readings.filter((r) => !ONLY || r.id === ONLY);
mkdirSync(outDir, { recursive: true });

const sentencesByReading = new Map();
const examples = new Map();

for (const reading of targets) {
  const verbs = tagReading(reading);
  const counts = { present: 0, past: 0 };
  for (const verb of verbs) counts[verb.tense] += 1;

  const payload = {
    textHash: createHash("sha256")
      .update(reading.text)
      .digest("hex")
      .slice(0, 12),
    tense: reading.tense,
    counts,
    verbs,
  };

  writeFileSync(
    join(outDir, `${reading.id}.verbs.json`),
    JSON.stringify(payload, null, 2) + "\n"
  );

  console.log(
    `${reading.id}  ${verbs.length} verbos  (${counts.present} presente / ${counts.past} pasado)`
  );

  if (!ONLY) {
    const sentences = scanSentences(reading.text);
    sentencesByReading.set(reading.id, sentences);

    for (const verb of verbs) {
      if (!verb.lemma) continue;
      const perLemma = examples.get(verb.lemma) ?? {};
      if (perLemma[verb.tense]) continue;

      const sentence = sentences.find(
        (item) => verb.from >= item.start && verb.to <= item.end
      );
      if (!sentence) continue;

      perLemma[verb.tense] = {
        tense: verb.tense,
        readingId: reading.id,
        readingTitle: reading.title,
        series: reading.series,
        sentence: sentence.text,
        from: verb.from - sentence.start,
        to: verb.to - sentence.start,
      };
      examples.set(verb.lemma, perLemma);
    }
  }

  if (args.includes("--report")) {
    for (const sentence of scanSentences(reading.text)) {
      const inside = verbs.filter(
        (v) => v.from >= sentence.start && v.to <= sentence.end
      );
      if (inside.length === 0) continue;

      let out = "";
      let cursor = sentence.start;
      const pattern = /[A-Za-z]+(?:'[A-Za-z]+)*|\s+|[^\sA-Za-z]+/g;
      let match;

      while ((match = pattern.exec(sentence.text)) !== null) {
        const from = sentence.start + match.index;
        const to = from + match[0].length;
        const hit = inside.find((v) => v.from <= from && v.to >= to);
        out += hit && /[A-Za-z]/.test(match[0]) ? `[${match[0]}]` : match[0];
        cursor = to;
      }

      if (cursor !== sentence.end) out += " ?";
      console.log(`    ${out}`);
    }
  }

  if (args.includes("--suspicious")) {
    const tokens = tokenize(reading.text);
    const tagged = new Set(
      verbs.flatMap((verb) => [
        ...reading.text
          .slice(verb.from, verb.to)
          .toLowerCase()
          .matchAll(/[A-Za-z]+/g),
      ].map((m) => m[0]))
    );

    const taggable = (word) =>
      (FORM_INDEX.get(word) ?? []).some(
        (entry) =>
          entry.kind === "base" ||
          (reading.tense === "past" && entry.kind === "past")
      );

    const looksVerbal = /ing$|ed$|s$/;
    const seen = new Set();
    const suspects = [];

    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (tagged.has(token.lower)) continue;
      if (seen.has(token.lower)) continue;
      if (SKIP_SURFACES.has(token.lower)) continue;
      if (!taggable(token.lower)) continue;

      const previous = tokens[i - 1]?.lower ?? "";
      const beforePrevious = tokens[i - 2]?.lower ?? "";
      const afterAuxOrModal =
        MODALS.has(previous) ||
        AUX.has(previous) ||
        (NEGATORS.has(previous) && AUX.has(beforePrevious));
      const participleAfterBe =
        (BE_PAST.has(previous) || BE_PRESENT.has(previous)) &&
        (FORM_INDEX.get(token.lower) ?? []).some(
          (entry) => entry.kind === "past"
        );

      if (!looksVerbal.test(token.lower) && !afterAuxOrModal) continue;
      if (participleAfterBe) continue;
      if (isInfinitiveOrParticiple(tokens, i)) continue;

      seen.add(token.lower);
      suspects.push(token.surface);
    }

    console.log(
      suspects.length === 0
        ? "    (sin verbos sin marcar)"
        : `    sin marcar: ${suspects.join(", ")}`
    );
  }
}

if (!ONLY) {
  const rows = LEMMAS.map((lemma) => {
    const past = IRREGULAR_PAST[lemma] ?? regularPast(lemma);
    const found = examples.get(lemma) ?? {};
    const list = [found.present, found.past].filter(Boolean);

    return {
      lemma,
      thirdPerson: thirdPerson(lemma),
      past,
      irregular: Boolean(IRREGULAR_PAST[lemma]),
      tenses: [...new Set(list.map((item) => item.tense))],
      examples: list,
    };
  });

  const auxiliaries = ["be", "do"].map((lemma) => {
    const found = examples.get(lemma) ?? {};
    const list = [found.present, found.past].filter(Boolean);

    return {
      lemma,
      thirdPerson: lemma === "be" ? "is" : "does",
      past: lemma === "be" ? "was" : "did",
      irregular: true,
      tenses: [...new Set(list.map((item) => item.tense))],
      examples: list,
    };
  });

  const all = [...auxiliaries, ...rows].sort((a, b) =>
    a.lemma.localeCompare(b.lemma)
  );
  const withExample = all.filter((row) => row.examples.length > 0).length;

  writeFileSync(
    join(outDir, "verbs.json"),
    JSON.stringify(
      {
        generatedFrom: "src/data/verb-catalog.json",
        readings: readings.map((reading) => ({
          id: reading.id,
          title: reading.title,
          series: reading.series,
          tense: reading.tense,
        })),
        total: all.length,
        withExample,
        verbs: all,
      },
      null,
      2
    ) + "\n"
  );

  console.log(
    `\nverbs.json  ${all.length} verbos, ${withExample} con ejemplo real, ${all.length - withExample} sin ejemplo`
  );
} else {
  console.log(
    "\n--only: no se regenera verbs.json (necesita todas las lecturas para los ejemplos)"
  );
}

console.log("\nVerifica el informe antes de darlo por bueno: un sustantivo marcado es un fallo.");
