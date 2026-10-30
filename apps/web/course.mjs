import { readFile } from "node:fs/promises";

export function parsePrograms(source) {
  const headings = [...source.matchAll(/^### ((?:FD|TS|NS|PG)-\d+) (.+)$/gm)];
  return headings.map((heading, index) => {
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? source.length;
    const body = source.slice(start, end).split(/^#{1,3} /m)[0].trim();
    return { code: heading[1], title: heading[2].trim(), body };
  });
}

export async function loadPrograms() {
  const source = await readFile(new URL("../../Backend_Course_Program_Requirements.md", import.meta.url), "utf8");
  return parsePrograms(source);
}
