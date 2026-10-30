import { createHighlighter } from "shiki";

let highlighterPromise;

async function highlighter() {
  highlighterPromise ??= createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: ["bash", "powershell", "text", "js", "javascript", "json", "markdown", "ts", "typescript", "sh"]
  });
  return highlighterPromise;
}

function highlightedLines(value) {
  const lines = new Set();
  for (const part of value.split(",")) {
    const [start, end] = part.split("-").map(Number);
    if (!Number.isInteger(start)) continue;
    for (let line = start; line <= (end || start); line += 1) lines.add(line);
  }
  return lines;
}

export async function highlightLesson(fences) {
  const highlighterInstance = await highlighter();
  const output = {};
  for (const { info, body } of fences) {
    const language = info.match(/^\S+/)?.[0]?.toLowerCase() ?? "text";
    if (!["text", "txt", "plaintext"].includes(language) && !highlighterInstance.getLoadedLanguages().includes(language)) {
      await highlighterInstance.loadLanguage(language);
    }
    const highlight = highlightedLines(info.match(/\bhighlight="([^"]+)"/)?.[1] ?? "");
    const highlighted = highlighterInstance.codeToHtml(body, {
      lang: language,
      themes: { dark: "github-dark", light: "github-light" },
      defaultColor: "dark",
      transformers: [{
        line(node, lineNumber) {
          if (highlight.has(lineNumber)) node.properties.class = `${node.properties.class} is-highlighted`;
        }
      }]
    });
    const code = highlighted.match(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/)?.[1];
    if (!code) throw new Error(`Shiki did not return a code element for "${language}".`);
    output[`${language}\0${body}`] = code;
  }
  return output;
}
