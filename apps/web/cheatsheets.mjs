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
  ,"PY-35": { title: "Functions: Reducing Duplication and Splitting Complex Tasks", file: "01 - Functions - Reducing Duplication and Splitting Complex Tasks.pdf" }
  ,"PY-36": { title: "Functions: Three More Features", file: "02 - Functions - Three More Features.pdf" }
  ,"PY-37": { title: "Scope and Namespace in Functions", file: "03 - Scope and Namespace in Functions.pdf" }
  ,"PY-38": { title: "Nonlocal versus Global Scopes", file: "04 - Nonlocal vs Global Scopes.pdf" }
  ,"PY-39": { title: "Handling Arguments in Functions", file: "05 - Handling Arguments in Functions.pdf" }
  ,"PY-40": { title: "Handling Multiple Returns in Functions", file: "06 - Handling Multiple Returns.pdf" }
  ,"PY-41": { title: "Lambdas, Pure versus Impure Functions", file: "07 - Lambdas, Pure vs Impure Functions.pdf" }
  ,"PY-42": { title: "Function Types in Python", file: "08 - Function Types.pdf" }
  ,"PY-43": { title: "Documenting Functions and Built-in Functions", file: "09 - Documenting Functions and Built-in Functions.pdf" }
  ,"PY-44": { title: "Functions in Python", file: "10 - Functions in Python.pdf" }
  ,"PY-45": { title: "Python Imports, Modules and __init__.py", file: "11 - Python Imports, Modules and __init__.py.pdf" }
  ,"PY-46": { title: "Python Imports", file: "12 - Python Imports.pdf" }
  ,"PY-47": { title: "List Comprehensions", file: "14 - List Comprehensions.pdf" }
  ,"PY-48": { title: "Set Comprehensions", file: "15 - Set Comprehensions.pdf" }
  ,"PY-49": { title: "Dictionary Comprehensions", file: "16 - Dictionary Comprehensions.pdf" }
  ,"PY-50": { title: "Generator Comprehensions for Memory Optimization", file: "17 - Generator Comprehensions for Memory Optimization.pdf" }
  ,"PY-51": { title: "Comprehensions in Python", file: "18 - Comprehensions in Python.pdf" }
  ,"PY-52": { title: "Generators with yield and next", file: "19 - Generators with yield and next.pdf" }
  ,"PY-53": { title: "Infinite Generators", file: "20 - Infinite Generators.pdf" }
  ,"PY-54": { title: "Send Values to Generators", file: "21 - Send Values to Generators.pdf" }
  ,"PY-55": { title: "yield from and Closing Generators", file: "22 - yield from and Closing Generators.pdf" }
  ,"PY-56": { title: "Decorators in Python", file: "23 - Decorators in Python.pdf" }
  ,"PY-57": { title: "Build a Logger with a Decorator", file: "24 - Build a Logger with a Decorator.pdf" }
  ,"PY-58": { title: "Build an Authorization Decorator", file: "25 - Build an Authorization Decorator.pdf" }
  ,"PY-59": { title: "Generators and Decorators in Python", file: "27 - Generators and Decorators in Python.pdf" }
};

export const cheatSheetGroups = [
  {
    id: "foundations",
    title: "1. Python foundations",
    required: true,
    topics: ["PY-01", "PY-02", "PY-03", "PY-04", "PY-05", "PY-06", "PY-07", "PY-08", "PY-09"]
  },
  {
    id: "conditionals",
    title: "2. Conditionals",
    required: false,
    topics: ["PY-10", "PY-11", "PY-12"]
  },
  {
    id: "loops",
    title: "3. Loops",
    required: false,
    topics: ["PY-13", "PY-14", "PY-15", "PY-16", "PY-17", "PY-18", "PY-19", "PY-20", "PY-21"]
  },
  {
    id: "functions",
    title: "4. Functions and modular programming",
    required: true,
    topics: ["PY-35", "PY-36", "PY-37", "PY-38", "PY-39", "PY-40", "PY-41", "PY-42", "PY-43", "PY-44", "PY-45", "PY-46"]
  },
  {
    id: "comprehensions",
    title: "5. Comprehensions and memory efficiency",
    required: true,
    topics: ["PY-47", "PY-48", "PY-49", "PY-50", "PY-51"]
  },
  {
    id: "generators-decorators",
    title: "6. Generators and decorators",
    required: true,
    topics: ["PY-52", "PY-53", "PY-54", "PY-55", "PY-56", "PY-57", "PY-58", "PY-59"]
  },
  {
    id: "object-oriented-programming",
    title: "7. Object-oriented programming",
    required: true,
    topics: ["PY-22", "PY-23", "PY-24", "PY-25", "PY-26", "PY-27", "PY-28", "PY-29", "PY-30", "PY-31", "PY-32", "PY-33", "PY-34"]
  },
  {
    id: "exception-handling",
    title: "8. Exception handling",
    required: true,
    topics: []
  },
  {
    id: "python-environments",
    title: "9. Python environments",
    required: true,
    topics: []
  },
  {
    id: "files-data-apis-databases",
    title: "10. Files, JSON, CSV, APIs, and databases",
    required: false,
    priority: "HIGH PRIORITY",
    topics: []
  }
];

// Some PDFs reference fonts they do not embed; pdf.js needs its bundled font files to draw them.
const standardFontDataUrl = `${join(dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json")), "standard_fonts")}/`;
const renderScale = 2;
const documents = new Map();
const pages = new Map();

export function cheatSheetFor(lessonId) {
  return Object.hasOwn(cheatSheets, lessonId) ? cheatSheets[lessonId] : undefined;
}

export function cheatSheetId(value) {
  if (Object.hasOwn(cheatSheets, value)) return value;
  if (/^\d+$/.test(value)) {
    const id = `PY-${value.padStart(2, "0")}`;
    if (Object.hasOwn(cheatSheets, id)) return id;
  }
  return undefined;
}

export function listCheatSheets() {
  return cheatSheetGroups.flatMap((group) => group.topics.map((id) => ({
    id,
    number: Number(id.slice(3)),
    title: cheatSheets[id].title,
    groupId: group.id,
    groupTitle: group.title,
    required: group.required
  })));
}

export function listCheatSheetGroups() {
  return cheatSheetGroups.map((group) => ({
    id: group.id,
    title: group.title,
    required: group.required,
    priority: group.priority ?? null,
    topics: group.topics.map((id) => ({ id, title: cheatSheets[id].title }))
  }));
}

export function cheatSheetNavigation(lessonId) {
  lessonId = cheatSheetId(lessonId);
  const sheets = listCheatSheets();
  const index = sheets.findIndex(({ id }) => id === lessonId);
  if (index < 0) return undefined;
  const previous = sheets[index - 1];
  const next = sheets[index + 1];
  return {
    position: index + 1,
    total: sheets.length,
    previous: previous ? { id: previous.id, title: previous.title } : null,
    next: next ? { id: next.id, title: next.title } : null
  };
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
  lessonId = cheatSheetId(lessonId);
  const sheet = cheatSheetFor(lessonId);
  if (!sheet) return undefined;
  const document = await openDocument(lessonId);
  return { id: lessonId, number: Number(lessonId.slice(3)), title: sheet.title, pageCount: document.numPages };
}

export async function renderCheatSheetPage(lessonId, pageNumber) {
  lessonId = cheatSheetId(lessonId);
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
