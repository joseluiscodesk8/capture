export type Block = {
  fragments: string[];
  length: number;
};

export declare const TARGET_BLOCK_CHARS: number;
export declare const MIN_BLOCK_CHARS: number;
export declare const MAX_BLOCK_CHARS: number;

export declare function splitSentences(paragraph: string): string[];
export declare function toParagraphs(text: string): string[][];
export declare function groupSentences(text: string): Block[];
