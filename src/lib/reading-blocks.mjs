export const TARGET_BLOCK_CHARS = 200;
export const MIN_BLOCK_CHARS = 90;
export const MAX_BLOCK_CHARS = 260;

export function splitSentences(paragraph) {
  return paragraph
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function toParagraphs(text) {
  return text
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(splitSentences);
}

export function scanSentences(text) {
  const sentences = [];
  const pattern = /\n\n/g;
  const bounds = [0];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    bounds.push(match.index, match.index + match[0].length);
  }
  bounds.push(text.length);

  let paragraphIndex = 0;

  for (let i = 0; i < bounds.length; i += 2) {
    const from = bounds[i];
    const to = bounds[i + 1] ?? text.length;
    const paragraph = text.slice(from, to);
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    const offset = from + paragraph.indexOf(trimmed);
    paragraphIndex += 1;

    for (const surface of splitSentences(trimmed)) {
      const start = offset + trimmed.indexOf(surface);
      sentences.push({
        text: surface,
        start,
        end: start + surface.length,
        length: surface.length,
        paragraph: paragraphIndex,
      });
    }
  }

  return sentences;
}

function makeBlock(group) {
  const surface = group.map((item) => item.text).join(" ");

  return {
    text: surface,
    start: group[0].start,
    end: group[group.length - 1].end,
    length: surface.length,
  };
}

function groupSentencesBySize(sentences) {
  const blocks = [];
  let current = [];
  let paragraph = 0;

  const flush = () => {
    if (current.length > 0) blocks.push(makeBlock(current));
    current = [];
  };

  for (const sentence of sentences) {
    if (current.length && sentence.paragraph !== paragraph) {
      flush();
    }
    paragraph = sentence.paragraph;

    const candidate = current.length
      ? current.map((item) => item.text).join(" ").length +
        1 +
        sentence.length
      : sentence.length;

    if (current.length && candidate > TARGET_BLOCK_CHARS) {
      flush();
    }

    current.push(sentence);
  }
  flush();

  return blocks;
}

function mergeShortBlocks(blocks) {
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];

    if (block.length < MIN_BLOCK_CHARS) {
      const next = blocks[index + 1];

      if (next && block.length + 1 + next.length <= MAX_BLOCK_CHARS) {
        block.text = `${block.text} ${next.text}`;
        block.end = next.end;
        block.length = block.text.length;
        blocks.splice(index + 1, 1);
        continue;
      }

      const previous = blocks[index - 1];

      if (previous && previous.length + 1 + block.length <= MAX_BLOCK_CHARS) {
        previous.text = `${previous.text} ${block.text}`;
        previous.end = block.end;
        previous.length = previous.text.length;
        blocks.splice(index, 1);
        index -= 1;
        continue;
      }
    }

    index += 1;
  }

  return blocks;
}

export function groupSentences(text) {
  return mergeShortBlocks(groupSentencesBySize(scanSentences(text)));
}

export function splitByMarks(text, marks) {
  if (!marks || marks.length === 0) return [{ text }];

  const sorted = [...marks].sort((a, b) => a.from - b.from);
  const segments = [];
  let cursor = 0;

  for (const mark of sorted) {
    if (mark.from < cursor || mark.to > text.length) continue;
    if (mark.from > cursor) segments.push({ text: text.slice(cursor, mark.from) });
    segments.push({ text: text.slice(mark.from, mark.to), tense: mark.tense });
    cursor = mark.to;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return segments;
}

export function buildBlocks(text, verbs) {
  return groupSentences(text).map((block) => {
    const marks = (verbs || [])
      .filter((verb) => verb.from >= block.start && verb.to <= block.end)
      .map((verb) => ({
        from: verb.from - block.start,
        to: verb.to - block.start,
        tense: verb.tense,
      }));

    return { ...block, segments: splitByMarks(block.text, marks) };
  });
}
