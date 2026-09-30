export type Song = {
  id: string;
  title: string;
  audio: string;
  lrc: string;
};

export type ExerciseType = "gap-fill";

export type GapFillExercise = {
  id: string;
  type: ExerciseType;
  line: string;
  answer: string;
  options: string[];
  explanation: string;
};

export type GrammarTopic = {
  id: string;
  title: string;
  level: string;
  summary: string;
  songIds: string[];
  exercises: GapFillExercise[];
};

export type GrammarData = {
  topics: GrammarTopic[];
};

export type Tense = "present" | "past";

export type ReadingTimings = {
  textHash: string;
  voice: string;
  wordsPerMinute: number;
  gapSeconds: number;
  blocks: number;
  starts: number[];
  duration: number;
};

export type VerbMark = {
  from: number;
  to: number;
  tense: Tense;
  lemma: string;
  surface: string;
};

export type ReadingVerbs = {
  textHash: string;
  tense: Tense;
  counts: { present: number; past: number };
  verbs: VerbMark[];
};

export type VerbExample = {
  tense: Tense;
  readingId: string;
  readingTitle: string;
  series: string;
  sentence: string;
  from: number;
  to: number;
};

export type VerbTableEntry = {
  lemma: string;
  thirdPerson: string;
  past: string;
  irregular: boolean;
  tenses: Tense[];
  examples: VerbExample[];
};

export type VerbTableReading = {
  id: string;
  title: string;
  series: string;
  tense: Tense;
};

export type VerbTable = {
  generatedFrom: string;
  readings: VerbTableReading[];
  total: number;
  withExample: number;
  verbs: VerbTableEntry[];
};

export type Reading = {
  id: string;
  title: string;
  series: string;
  tense: Tense;
  text: string;
  audio?: string;
  timings?: string;
  verbs?: string;
  vocabulary: { term: string; meaning: string }[];
};

export type ReadingData = {
  readings: Reading[];
};
