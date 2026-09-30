import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readingsPath = join(root, "src", "data", "readings.json");

const { groupSentences, splitSentences, MIN_BLOCK_CHARS, MAX_BLOCK_CHARS } =
  await import(new URL("../src/lib/reading-blocks.mjs", import.meta.url).href);

const { readings } = JSON.parse(readFileSync(readingsPath, "utf8"));

const failures = [];
const warnings = [];
const infos = [];

const fail = (id, msg) => failures.push({ id, msg });
const warn = (id, msg) => warnings.push({ id, msg });
const info = (id, msg) => infos.push({ id, msg });

const textHash = (text) =>
  createHash("sha256").update(text).digest("hex").slice(0, 12);

function checkAudio(id, reading, blockCount) {
  const hasAudioField = Boolean(reading.audio);
  const hasTimingsField = Boolean(reading.timings);

  if (!hasAudioField && !hasTimingsField) {
    info(id, "sin audio (modo lectura manual)");
    return;
  }

  if (!hasAudioField || !hasTimingsField) {
    fail(id, "audio y timings deben declararse los dos");
    return;
  }

  const mp3 = join(root, "public", reading.audio.replace(/^\//, ""));
  const timingsFile = join(root, "public", reading.timings.replace(/^\//, ""));

  if (!existsSync(mp3)) {
    fail(id, `falta el audio: public${reading.audio}`);
    return;
  }

  if (!existsSync(timingsFile)) {
    fail(id, `falta el timings: public${reading.timings}`);
    return;
  }

  const timings = JSON.parse(readFileSync(timingsFile, "utf8"));

  if (timings.textHash !== textHash(reading.text)) {
    fail(
      id,
      `el audio está desfasado: el texto cambió (hash ${timings.textHash} != ${textHash(reading.text)}). Regenera con npm run narrate`
    );
    return;
  }

  if (timings.blocks !== blockCount) {
    fail(
      id,
      `el audio está desfasado: ${timings.blocks} tiempos para ${blockCount} bloques`
    );
    return;
  }

  if (!Array.isArray(timings.starts) || timings.starts.length !== blockCount) {
    fail(id, `"starts" no tiene un tiempo por bloque`);
    return;
  }

  for (let i = 1; i < timings.starts.length; i += 1) {
    if (timings.starts[i] <= timings.starts[i - 1]) {
      fail(id, `los tiempos de "starts" no son crecientes en el bloque ${i + 1}`);
      return;
    }
  }

  if (timings.starts[0] !== 0) {
    fail(id, `"starts" debe empezar en 0`);
    return;
  }

  info(
    id,
    `audio ok: ${timings.starts.length} bloques, ${timings.voice} ${timings.wordsPerMinute} wpm, ${timings.duration}s`
  );
}

const BE_PRESENT = /\b(is|am|are|isn't|aren't)\b/;
const DO_PRESENT = /\b(do|does|don't|doesn't)\b/;
const PRESENT_ADVERB = /\b(today|now|every (day|morning|night))\b/;
const HABIT_ADVERB = /\b(always|usually|often)\b/;

const PRONOUN_BASE_VERB = new RegExp(
  "\\b(he|she|it|they|we|I)\\s+(" +
    [
      "go",
      "come",
      "see",
      "eat",
      "run",
      "fly",
      "fight",
      "train",
      "return",
      "say",
      "tell",
      "give",
      "die",
      "win",
      "lose",
      "know",
      "feel",
      "become",
      "take",
      "make",
      "find",
      "leave",
      "stand",
      "fall",
      "hold",
      "keep",
      "break",
      "call",
      "stop",
      "drop",
      "bury",
      "protect",
      "smell",
      "scream",
      "plan",
    ].join("|") +
    ")\\b"
);

const HAS_PRESENT = /\b(has|have|had)\b/;

const PAST_WORDS = new RegExp(
  "\\b(" +
    [
      "was",
      "were",
      "had",
      "did",
      "wasn't",
      "weren't",
      "didn't",
      "said",
      "went",
      "made",
      "knew",
      "came",
      "saw",
      "got",
      "gave",
      "took",
      "found",
      "told",
      "became",
      "left",
      "felt",
      "heard",
      "held",
      "brought",
      "kept",
      "won",
      "fought",
      "flew",
      "grew",
      "drew",
      "fell",
      "rose",
      "ran",
      "wrote",
      "sold",
      "sent",
      "built",
      "thought",
      "caught",
      "chose",
      "died",
      "drove",
      "ate",
      "forgot",
      "froze",
      "hid",
      "hit",
      "hurt",
      "laid",
      "led",
      "meant",
      "met",
      "paid",
      "put",
      "read",
      "rode",
      "shot",
      "shut",
      "sank",
      "sang",
      "slept",
      "spoke",
      "spent",
      "stole",
      "swore",
      "threw",
      "understood",
      "woke",
      "wore",
      "trained",
      "killed",
      "destroyed",
      "buried",
      "kissed",
      "protected",
      "planned",
      "arranged",
      "cried",
      "lied",
      "died",
      "buried",
      "greeted",
    ].join("|") +
    ")\\b"
);

const PAST_ED = new RegExp(
  "\\b(" +
    [
      "trained",
      "killed",
      "destroyed",
      "turned",
      "cracked",
      "stood",
      "shouted",
      "smiled",
      "called",
      "dropped",
      "stopped",
      "landed",
      "opened",
      "closed",
      "moved",
      "looked",
      "lived",
      "buried",
      "carried",
      "touched",
      "passed",
      "needed",
      "used",
      "worked",
      "walked",
      "fought",
      "helped",
      "tried",
      "learned",
      "changed",
      "followed",
      "happened",
      "started",
      "planned",
      "jumped",
      "grabbed",
      "pulled",
      "threw",
      "blew",
      "grew",
      "bowed",
      "swore",
    ].join("|") +
    ")\\b"
);

const BACKSTORY = /\b(many years ago|years ago|one night|one evening|one day|one summer|once upon|long ago|ago|in 1[0-9]{3}|back then)\b/;

const PAST_ADVERB = /\b(later|finally|eventually|afterwards|at last)\b/;

function checkVerbs(id, reading, blocks) {
  if (!reading.verbs) {
    info(id, "sin verbos marcados (lectura sin resaltar)");
    return;
  }

  const file = join(root, "public", reading.verbs.replace(/^\//, ""));

  if (!existsSync(file)) {
    fail(id, `falta el verbs: public${reading.verbs}`);
    return;
  }

  const data = JSON.parse(readFileSync(file, "utf8"));
  const expectedHash = textHash(reading.text);

  if (data.textHash !== expectedHash) {
    fail(
      id,
      `los verbos están desfasados: el texto cambió (hash ${data.textHash} != ${expectedHash}). Regenera con npm run verbs`
    );
    return;
  }

  if (data.tense !== reading.tense) {
    fail(id, `el tense de los verbos (${data.tense}) no coincide con la lectura`);
    return;
  }

  if (!Array.isArray(data.verbs) || data.verbs.length === 0) {
    fail(id, "no hay verbos marcados");
    return;
  }

  const text = reading.text;
  let previousTo = -1;

  for (const verb of data.verbs) {
    if (verb.from < 0 || verb.to > text.length || verb.from >= verb.to) {
      fail(id, `rango inválido en un verbo: ${verb.from}-${verb.to}`);
      return;
    }

    if (text.slice(verb.from, verb.to) !== verb.surface) {
      fail(
        id,
        `el verbo "${verb.surface}" no está en el texto (offsets desfasados)`
      );
      return;
    }

    if (verb.from < previousTo) {
      fail(id, `los verbos se solapan en "${verb.surface}"`);
      return;
    }

    if (verb.tense !== reading.tense) {
      fail(
        id,
        `"${verb.surface}" está marcado como ${verb.tense} en una lectura en ${reading.tense}`
      );
      return;
    }

    previousTo = verb.to;
  }

  const outside = data.verbs.filter(
    (verb) => !blocks.some((b) => verb.from >= b.start && verb.to <= b.end)
  );

  if (outside.length > 0) {
    fail(
      id,
      `${outside.length} verbo(s) caen fuera de cualquier bloque: ${outside
        .map((v) => `"${v.surface}"`)
        .join(", ")}`
    );
    return;
  }

  const total = data.counts.present + data.counts.past;

  if (total !== data.verbs.length) {
    fail(id, `los counts (${total}) no cuadran con ${data.verbs.length} verbos`);
    return;
  }

  if (data.verbs.length < 20) {
    warn(
      id,
      `solo ${data.verbs.length} verbos marcados; revisa que no falte ninguno`
    );
  }

  info(
    id,
    `verbos ok: ${data.verbs.length} (${data.counts.present} presente / ${data.counts.past} pasado)`
  );
}

const seenIds = new Set();
const seriesTenses = new Map();

for (const reading of readings) {
  const id = reading.id;

  for (const field of ["id", "title", "series", "tense", "text"]) {
    if (!reading[field]) fail(id, `falta el campo "${field}"`);
  }

  if (!Array.isArray(reading.vocabulary) || reading.vocabulary.length === 0) {
    fail(id, "el glossary está vacío");
  }

  if (reading.tense !== "present" && reading.tense !== "past") {
    fail(id, `tense inválido: "${reading.tense}"`);
    continue;
  }

  if (seenIds.has(id)) fail(id, "id duplicado");
  seenIds.add(id);

  const paragraphs = reading.text.split("\n\n").filter((p) => p.trim());
  if (paragraphs.length < 3) {
    fail(id, `solo ${paragraphs.length} párrafo(s); se esperan al menos 3`);
  }

  const words = reading.text.split(/\s+/).filter(Boolean).length;
  if (words < 150 || words > 1250) {
    warn(id, `${words} palabras (rango válido 150-1250; los capítulos de saga apuntan a ~1000)`);
  }

  const blocks = groupSentences(reading.text);
  if (blocks.length < 6) {
    warn(id, `solo ${blocks.length} bloques de lectura`);
  }

  const tooShort = blocks.filter((b) => b.length < MIN_BLOCK_CHARS);
  if (tooShort.length > 0) {
    fail(
      id,
      `${tooShort.length} bloque(s) de menos de ${MIN_BLOCK_CHARS} caracteres (saldrían a una línea): ${tooShort
        .map((b) => `"${b.text}"`)
        .join(", ")}`
    );
  }

  const tooLong = blocks.filter((b) => b.length > MAX_BLOCK_CHARS);
  if (tooLong.length > 0) {
    fail(id, `${tooLong.length} bloque(s) de más de ${MAX_BLOCK_CHARS} caracteres`);
  }

  checkAudio(id, reading, blocks.length);
  checkVerbs(id, reading, blocks);

  if (!seriesTenses.has(reading.series)) seriesTenses.set(reading.series, new Set());
  seriesTenses.get(reading.series).add(reading.tense);

  for (const sentence of splitSentences(paragraphs.join(" "))) {
    if (reading.tense === "past") {
      if (BE_PRESENT.test(sentence)) {
        fail(id, `verbo "to be" en presente → "${sentence}"`);
      }
      if (DO_PRESENT.test(sentence)) {
        fail(id, `auxiliar do/does en presente → "${sentence}"`);
      }
      if (PRESENT_ADVERB.test(sentence)) {
        fail(id, `marcador de presente (today/now/every day) → "${sentence}"`);
      }
      if (PRONOUN_BASE_VERB.test(sentence)) {
        fail(id, `sujeto + verbo en infinitivo en vez de pasado → "${sentence}"`);
      }
      if (HAS_PRESENT.test(sentence) && !/\bhas to\b|\bhave to\b/.test(sentence)) {
        warn(id, `presente perfecto/auxiliar has/have en un relato en pasado → "${sentence}"`);
      }
      if (HABIT_ADVERB.test(sentence)) {
        warn(id, `adverbio de hábito (always/usually/often) en relato en pasado → "${sentence}"`);
      }
    } else {
      if (PAST_WORDS.test(sentence) || PAST_ED.test(sentence)) {
        if (BACKSTORY.test(sentence)) {
          info(id, `pasado en una cláusula de backstory (aceptado) → "${sentence}"`);
        } else {
          warn(id, `forma en pasado dentro de una lectura en presente → "${sentence}"`);
        }
      }
      if (PAST_ADVERB.test(sentence)) {
        warn(id, `adverbio de pasado ("then/later/finally") → "${sentence}"`);
      }
    }
  }
}

for (const [series, tenses] of seriesTenses) {
  if (!tenses.has("present") || !tenses.has("past")) {
    info(
      series,
      `la serie "${series}" solo tiene ${[...tenses].join(", ")}; cada historia va en un solo tiempo y no hace falta la otra versión`
    );
  }
}

const report = (title, items) => {
  if (items.length === 0) return;
  console.log(`\n${title} (${items.length})`);
  for (const item of items) console.log(`  [${item.id}] ${item.msg}`);
};

console.log(`Lecturas: ${readings.length}`);

for (const reading of readings) {
  const blocks = groupSentences(reading.text);
  const words = reading.text.split(/\s+/).filter(Boolean).length;
  const sizes = blocks.map((b) => b.length);
  const label = reading.tense === "present" ? "presente" : "pasado  ";
  console.log(
    `  ${label}  ${String(blocks.length).padStart(2)} bloques  ${String(words).padStart(3)} palabras  ` +
      `bloque ${String(Math.min(...sizes)).padStart(3)}-${String(Math.max(...sizes)).padStart(3)} ch  ` +
      `${reading.title} (${reading.series})`
  );
}

report("FALLOS", failures);
report("AVISOS", warnings);
report("INFO", infos);

if (failures.length > 0) {
  console.log(`\n${failures.length} fallo(s). Corregir antes de continuar.`);
  process.exit(1);
}

console.log("\nSin fallos de consistencia de tiempo verbal.");
