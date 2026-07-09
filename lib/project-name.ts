// Trims a single trailing "s" off a word (e.g. "Courses" -> "Course").
// Deliberately simple, per how the team actually names projects — not a
// general English singularizer (skips short words and trailing "ss" so
// "Is"/"Business" etc. are left alone).
const singularize = (word: string): string => {
  const lower = word.toLowerCase();
  if (lower.length > 3 && lower.endsWith("s") && !lower.endsWith("ss")) return word.slice(0, -1);
  return word;
};

const capitalize = (word: string): string =>
  word.length === 0 ? word : word[0].toUpperCase() + word.slice(1).toLowerCase();

// Normalizes a free-typed project/group name into a stable CamelCase key,
// e.g. "english courses" -> "EnglishCourse". Used so the same project typed
// with different casing/pluralization still groups together on the dashboard.
export const normalizeProjectName = (raw: string): string =>
  raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => capitalize(singularize(word)))
    .join("");
