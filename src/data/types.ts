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

export type Reading = {
  id: string;
  title: string;
  series: string;
  tense: Tense;
  level: string;
  text: string;
  audio?: string;
  timings?: string;
  vocabulary: { term: string; meaning: string }[];
};

export type ReadingData = {
  readings: Reading[];
};
