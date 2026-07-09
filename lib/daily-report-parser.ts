export type ParsedDailyReport = {
  fullName: string | null;
  projectNameRaw: string | null;
  tasksToComplete: string | null;
  todayPlan: string | null;
  difficulties: string | null;
};

type FieldKey = keyof ParsedDailyReport;

// Each field's label, with a diacritic-free fallback in case a member types
// without Vietnamese input enabled.
const LABELS: [FieldKey, string[]][] = [
  ["fullName", ["họ và tên", "ho va ten"]],
  ["projectNameRaw", ["nhóm dự án", "nhom du an"]],
  ["tasksToComplete", ["công việc phải hoàn thành", "cong viec phai hoan thanh"]],
  ["todayPlan", ["việc sẽ làm hôm nay", "viec se lam hom nay"]],
  ["difficulties", ["khó khăn cần hỗ trợ", "kho khan can ho tro"]],
];

const alternativeToKey = new Map<string, FieldKey>();
const alternatives: string[] = [];
for (const [key, alts] of LABELS) {
  for (const alt of alts) {
    alternativeToKey.set(alt, key);
    alternatives.push(alt);
  }
}
// Longest first so overlapping prefixes never shadow a longer alternative.
alternatives.sort((a, b) => b.length - a.length);

// Matches a label at the start of a line, tolerating a leading bullet
// ("+ ", "- ", "• ") and surrounding whitespace, e.g. "+ Họ và tên:".
const LABEL_PATTERN = new RegExp(
  `^[ \\t]*[+\\-•]*[ \\t]*(${alternatives.join("|")})[ \\t]*:`,
  "gim"
);

// Parses the labeled daily-report format into its five fields. Each value
// runs from right after its label's colon until the next known label (or the
// end of the message), so multi-line answers still work. Returns null if none
// of the known labels are found, so callers can fall back to the raw text.
export const parseDailyReportMessage = (text: string): ParsedDailyReport | null => {
  const matches: { key: FieldKey; start: number; valueStart: number }[] = [];

  LABEL_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LABEL_PATTERN.exec(text)) !== null) {
    const key = alternativeToKey.get(match[1].toLowerCase());
    if (!key) continue;
    matches.push({ key, start: match.index, valueStart: match.index + match[0].length });
  }

  if (matches.length === 0) return null;

  const result: ParsedDailyReport = {
    fullName: null,
    projectNameRaw: null,
    tasksToComplete: null,
    todayPlan: null,
    difficulties: null,
  };

  matches.forEach((current, i) => {
    const end = matches[i + 1]?.start ?? text.length;
    const value = text.slice(current.valueStart, end).trim();
    result[current.key] = value.length > 0 ? value : null;
  });

  return result;
};
