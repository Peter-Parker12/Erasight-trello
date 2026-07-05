import { OrgMember } from "@/lib/org-members";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip Vietnamese diacritics
    .trim();

// Matches a plain name from the workbook (e.g. "Paul", "Tiến") against the
// org's member list by exact or first-token match on their display name.
export const matchOrgMember = (name: string, members: OrgMember[]): string | null => {
  const target = normalize(name);
  if (!target) return null;

  const exact = members.find((m) => normalize(m.userName) === target);
  if (exact) return exact.userId;

  const firstTokenMatch = members.find((m) => {
    const firstToken = normalize(m.userName).split(/\s+/)[0];
    return firstToken === target;
  });
  if (firstTokenMatch) return firstTokenMatch.userId;

  const containsMatch = members.find((m) => normalize(m.userName).includes(target));
  return containsMatch?.userId ?? null;
};

export const buildOwnerNameGuesses = (
  ownerNames: string[],
  members: OrgMember[]
): Record<string, string | null> => {
  const guesses: Record<string, string | null> = {};
  for (const name of ownerNames) {
    guesses[name] = matchOrgMember(name, members);
  }
  return guesses;
};
