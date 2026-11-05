import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = fileURLToPath(new URL("../../course_details/Python/", import.meta.url));

// Lesson ID -> cheat sheet. Add an entry here to attach a PDF to another lesson.
export const cheatSheets = {
  "PY-01": { title: "Python Tuples & Membership Testing", file: "Python_Tuples_Membership_Cheat_Sheet.pdf" },
  "PY-02": { title: "Python Numbers, Booleans & Operators", file: "python_numbers_booleans_operators_cheat_sheet.pdf" },
  "PY-04": { title: "Python Lists", file: "Python_Lists_Cheat_Sheet.pdf" },
  "PY-05": { title: "Python Sets & Frozensets", file: "01_Python_Set_and_Frozenset_Cheat_Sheet.pdf" },
  "PY-06": { title: "Python Dictionaries", file: "02_Python_Dictionary_Cheat_Sheet.pdf" },
  "PY-07": { title: "Python collections Module", file: "03_Python_Collections_Advanced_Data_Types_Cheat_Sheet.pdf" },
  "PY-08": { title: "Python Data Types", file: "04_Python_Data_Types_Cheat_Sheet.pdf" },
  "PY-09": { title: "Python Operator Overloading & bytearray", file: "05_Python_Operator_Overloading_and_bytearray_Cheat_Sheet.pdf" },
  "PY-03": { title: "Python Strings: Index, Slice & Encoding", file: "Python_Strings_Index_Slice_Encoding_Cheat_Sheet.pdf" }
};

// Some PDFs reference fonts they do not embed; pdf.js needs its bundled font files to draw them.
const standardFontDataUrl = `${join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts")}/`;
const renderScale = 2;
const documents = new Map();
const pages = new Map();

export function cheatSheetFor(lessonId) {
  return Object.hasOwn(cheatSheets, lessonId) ? cheatSheets[lessonId] : undefined;
}

// The PDF stays on the server; learners only receive rendered page images.
async function openDocument(lessonId) {
  if (!documents.has(lessonId)) {
    const task = (async () => {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const data = new Uint8Array(await readFile(join(sourceDirectory, cheatSheets[lessonId].file)));
      return getDocument({ data, useSystemFonts: false, standardFontDataUrl }).promise;
    })();
    documents.set(lessonId, task);
    task.catch(() => documents.delete(lessonId));
  }
  return documents.get(lessonId);
}

export async function cheatSheetInfo(lessonId) {
  const sheet = cheatSheetFor(lessonId);
  if (!sheet) return undefined;
  const document = await openDocument(lessonId);
  return { id: lessonId, title: sheet.title, pageCount: document.numPages };
}

export async function renderCheatSheetPage(lessonId, pageNumber) {
  if (!cheatSheetFor(lessonId)) return undefined;
  const document = await openDocument(lessonId);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > document.numPages) return undefined;
  const key = `${lessonId}:${pageNumber}`;
  if (!pages.has(key)) {
    const task = (async () => {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: renderScale });
      const { canvas, context } = document.canvasFactory.create(viewport.width, viewport.height);
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      return canvas.toBuffer("image/png");
    })();
    pages.set(key, task);
    task.catch(() => pages.delete(key));
  }
  return pages.get(key);
}
