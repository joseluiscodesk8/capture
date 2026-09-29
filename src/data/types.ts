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
