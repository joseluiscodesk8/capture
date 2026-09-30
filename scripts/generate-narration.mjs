import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { groupSentences } from "../src/lib/reading-blocks.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readingsPath = join(root, "src", "data", "readings.json");
const audioDir = join(root, "public", "audio");
const timingsDir = join(root, "public", "data");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const VOICE = flag("voice", "Samantha");
const WPM = Number(flag("wpm", "165"));
const GAP = Number(flag("gap", "0.45"));
const ONLY = flag("only", null);
const PRINT_SPOKEN = args.includes("--print-spoken");
const SAMPLE_RATE = 22050;
const MP3_BITRATE = "96k";

const PRONUNCIATIONS = new Map(
  Object.entries({
    "Super Saiyan": "super sigh yan",
    "Piccolo Daimao": "pee koh low dye mow",
    "Tao Pai Pai": "tow pie pie",
    "Hitokiri Battosai": "hi toh kee ree bat to sigh",
    "Dragon Gate": "dragon gate",
    "Shinsengumi": "shin sen goo mee",
    "Turtle Hermit": "tur tle her mit",
    "Red Ribbon": "red ri bun",
    "Chi-Chi": "chee chee",
    Battosai: "bat to sigh",
    Tenshinhan: "ten sheen han",
    Saiyan: "sigh yan",
    Krillin: "kri lin",
    Frieza: "free za",
    Yamcha: "yam cha",
    Vegeta: "veh geh ta",
    Gohan: "go han",
    Goku: "goh koo",
    Roshi: "roh shee",
    Bulma: "bool muh",
    Karin: "kah reen",
    Piccolo: "pee koh low",
    Daimao: "dye mow",
    Pilaf: "pye laf",
    Oolong: "oh loong",
    Puar: "poo ahr",
    Upa: "oo pah",
    rurouni: "ru roo nee",
    Kenshin: "ken sheen",
    Himura: "hee moo ra",
    Hayato: "ha ya toh",
    Kataoka: "ka ta oh ka",
    Hyodo: "hyoh doh",
    Seijo: "say ee joh",
    Isao: "ee sah oh",
    Tokyo: "toh kee oh",
    Manslayer: "man slayer",
    Edo: "eh do",
    Ito: "ee toh",
  })
);

const PRONOUNCIATION_ORDER = [...PRONUNCIATIONS.keys()].sort(
  (a, b) => b.length - a.length
);

const PRONUNCIATION_PATTERN = new RegExp(
  `\\b(${PRONOUNCIATION_ORDER.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "g"
);

function applyPronunciations(text) {
  return text.replace(
    PRONUNCIATION_PATTERN,
    (match) => PRONUNCIATIONS.get(match) ?? match
  );
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error(
      `${command} falló (${result.status}): ${(result.stderr || result.stdout || "").trim()}`
    );
  }

  return result.stdout;
}

function duration(file) {
  return Number(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      file,
    ]).trim()
  );
}

function hash(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

mkdirSync(audioDir, { recursive: true });
mkdirSync(timingsDir, { recursive: true });

const voiceList = run("say", ["-v", "?"]);
if (!voiceList.includes(VOICE)) {
  throw new Error(`La voz "${VOICE}" no está instalada. Usa: say -v '?'`);
}

const { readings } = JSON.parse(readFileSync(readingsPath, "utf8"));
const targets = readings.filter(
  (reading) => !ONLY || reading.id === ONLY
);

if (targets.length === 0) {
  throw new Error(`Ninguna lectura con id "${ONLY}"`);
}

const work = join(tmpdir(), "catcher-narration");
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const silence = join(work, "silence.wav");
run("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-f",
  "lavfi",
  "-i",
  `anullsrc=r=${SAMPLE_RATE}:cl=mono`,
  "-t",
  String(GAP),
  "-c:a",
  "pcm_s16le",
  silence,
]);

console.log(
  `voz=${VOICE}  ${WPM} wpm  pausa=${GAP}s  lecturas=${targets.length}\n`
);

let drift = 0;

for (const reading of targets) {
  const blocks = groupSentences(reading.text);
  const workDir = join(work, reading.id);
  mkdirSync(workDir, { recursive: true });

  const parts = [];
  const durations = [];

  for (const [index, block] of blocks.entries()) {
    const spoken = applyPronunciations(block.text);
    const aiff = join(workDir, `blk${index}.aiff`);
    const wav = join(workDir, `blk${index}.wav`);

    if (PRINT_SPOKEN) {
      console.log(`\n  bloque ${index + 1} — se envía a say:\n  ${spoken}\n`);
    }

    run("say", ["-v", VOICE, "-r", String(WPM), "-o", aiff, spoken]);

    run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-i",
      aiff,
      "-ar",
      String(SAMPLE_RATE),
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      wav,
    ]);

    const seconds = duration(wav);
    durations.push(seconds);
    parts.push(wav);

    if (index < blocks.length - 1) parts.push(silence);
  }

  const listFile = join(workDir, "parts.txt");
  writeFileSync(
    listFile,
    parts.map((part) => `file '${part}'`).join("\n") + "\n"
  );

  const joined = join(workDir, "joined.wav");
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-c:a",
    "pcm_s16le",
    joined,
  ]);

  const mp3 = join(audioDir, `${reading.id}.mp3`);
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    joined,
    "-codec:a",
    "libmp3lame",
    "-b:a",
    MP3_BITRATE,
    "-ac",
    "1",
    mp3,
  ]);

  const starts = [];
  let cursor = 0;
  for (const seconds of durations) {
    starts.push(Number(cursor.toFixed(3)));
    cursor += seconds + GAP;
  }

  const expected =
    durations.reduce((total, seconds) => total + seconds, 0) +
    GAP * (durations.length - 1);

  const actual = duration(mp3);
  const delta = Math.abs(expected - actual);
  drift = Math.max(drift, delta);

  writeFileSync(
    join(timingsDir, `${reading.id}.timings.json`),
    JSON.stringify(
      {
        textHash: hash(reading.text),
        voice: VOICE,
        wordsPerMinute: WPM,
        gapSeconds: GAP,
        blocks: blocks.length,
        starts,
        duration: Number(actual.toFixed(3)),
      },
      null,
      2
    ) + "\n"
  );

  console.log(
    `${reading.id}\n  ${blocks.length} bloques  ${expected.toFixed(2)}s esperado  ` +
      `${actual.toFixed(2)}s real  desfase ${delta.toFixed(3)}s`
  );
}

rmSync(work, { recursive: true, force: true });

if (drift > 0.25) {
  console.error(
    `\nDesfase demasiado grande (${drift.toFixed(3)}s). Los tiempos no son fiables.`
  );
  process.exit(1);
}

console.log(`\nNarración lista. Desfase máximo ${drift.toFixed(3)}s.`);
