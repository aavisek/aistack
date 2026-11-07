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
  "PY-10": { title: "Python Conditionals", file: "01_Conditionals_in_Python.pdf" },
  "PY-11": { title: "Smart Thermostat System", file: "02_Smart_Thermostat_System.pdf" },
  "PY-12": { title: "Loan Eligibility Checker", file: "03_Loan_Eligibility_Checker.pdf" },
  "PY-13": { title: "Introduction to Loops", file: "04_Introduction_to_Loops.pdf" },
  "PY-14": { title: "Looping Through Lists", file: "05_Looping_Through_Lists.pdf" },
  "PY-15": { title: "Why Use enumerate", file: "06_Why_Use_enumerate.pdf" },
  "PY-16": { title: "Combining Lists with zip", file: "07_zip_Combines_Lists.pdf" },
  "PY-17": { title: "Introducing while Loops", file: "08_Introducing_while_Loops.pdf" },
  "PY-18": { title: "Break, Continue & Loop Else", file: "09_Break_Continue_and_Loop_Else.pdf" },
  "PY-19": { title: "Dictionary in Place of Match Case", file: "10_Dictionary_in_Place_of_Match_Case.pdf" },
  "PY-20": { title: "The Walrus Operator", file: "11_Walrus_Operator.pdf" },
  "PY-21": { title: "Loops in Python", file: "12_Loops_in_Python.pdf" },
  "PY-03": { title: "Python Strings: Index, Slice & Encoding", file: "Python_Strings_Index_Slice_Encoding_Cheat_Sheet.pdf" },
  "PY-22": { title: "Building Your First Class and Object", file: "01_Building_Your_First_Class_and_Object.pdf" },
  "PY-23": { title: "Class and Object Namespace", file: "02_Class_and_Object_Namespace.pdf" },
  "PY-24": { title: "Attribute Shadowing", file: "03_Attribute_Shadowing.pdf" },
  "PY-25": { title: "self in Python", file: "04_self_in_Python.pdf" },
  "PY-26": { title: "Constructors and __init__", file: "05_Constructors_and_init.pdf" },
  "PY-27": { title: "Three Ways to Access a Base Class", file: "07_Three_Ways_to_Access_a_Base_Class.pdf" },
  "PY-28": { title: "Method Resolution Order (MRO)", file: "08_Method_Resolution_Order_MRO.pdf" },
  "PY-29": { title: "Static Methods", file: "09_Static_Methods.pdf" },
  "PY-30": { title: "Class Method vs Static Method", file: "10_Class_Method_vs_Static_Method.pdf" },
  "PY-31": { title: "Property Decorator: Getter and Setter", file: "11_Property_Decorator_Getter_and_Setter.pdf" },
  "PY-32": { title: "Object-Oriented Programming: The 4 Pillars", file: "12_Object_Oriented_Programming_The_4_Pillars.pdf" },
  "PY-33": { title: "Design an Object-Oriented Python Application", file: "13_Design_an_Object_Oriented_Python_Application.pdf" },
  "PY-34": { title: "Python OOP Quick Reference", file: "Bonus_Quick_Reference.pdf" }
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
