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

export function groupSentences(text) {
  const blocks = [];

  for (const paragraph of toParagraphs(text)) {
    let current = [];

    for (const sentence of paragraph) {
      const candidate = current.length
        ? current.join(" ").length + 1 + sentence.length
        : sentence.length;

      if (current.length && candidate > TARGET_BLOCK_CHARS) {
        blocks.push({
          fragments: [current.join(" ")],
          length: current.join(" ").length,
        });
        current = [sentence];
      } else {
        current.push(sentence);
      }
    }

    if (current.length > 0) {
      blocks.push({
        fragments: [current.join(" ")],
        length: current.join(" ").length,
      });
    }
  }

  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];

    if (block.length < MIN_BLOCK_CHARS) {
      const next = blocks[index + 1];
      if (next && block.length + 1 + next.length <= MAX_BLOCK_CHARS) {
        block.fragments.push(...next.fragments);
        block.length += 1 + next.length;
        blocks.splice(index + 1, 1);
        continue;
      }

      const previous = blocks[index - 1];
      if (previous && previous.length + 1 + block.length <= MAX_BLOCK_CHARS) {
        previous.fragments.push(...block.fragments);
        previous.length += 1 + block.length;
        blocks.splice(index, 1);
        index -= 1;
        continue;
      }
    }

    index += 1;
  }

  return blocks;
}
