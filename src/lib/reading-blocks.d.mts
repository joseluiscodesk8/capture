export type Tense = "present" | "past";

export type VerbMark = {
  from: number;
  to: number;
  tense: Tense;
  surface: string;
};

export type Sentence = {
  text: string;
  start: number;
  end: number;
  length: number;
  paragraph: number;
};

export type Block = {
  text: string;
  start: number;
  end: number;
  length: number;
};

export type Segment = {
  text: string;
  tense?: Tense;
};

export type MarkedBlock = Block & {
  segments: Segment[];
};

export declare const TARGET_BLOCK_CHARS: number;
export declare const MIN_BLOCK_CHARS: number;
export declare const MAX_BLOCK_CHARS: number;

export declare function splitSentences(paragraph: string): string[];
export declare function toParagraphs(text: string): string[][];
export declare function scanSentences(text: string): Sentence[];
export declare function groupSentences(text: string): Block[];
export declare function splitByMarks(
  text: string,
  marks: { from: number; to: number; tense: Tense }[]
): Segment[];
export declare function buildBlocks(
  text: string,
  verbs?: VerbMark[] | null
): MarkedBlock[];
