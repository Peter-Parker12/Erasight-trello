import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const CLAUDE_MODEL = process.env.CLAUDE_REVIEW_MODEL ?? "claude-sonnet-4-6";

function buildPrompt(
  content: string,
  cardContext: string,
  skills: { name: string; description: string; prompt: string }[],
  partnerContext: string | null
): string {
  const parts: string[] = [];

  if (partnerContext) {
    parts.push(`Partner context — apply this throughout your review:\n${partnerContext}\n\n`);
  }

  if (skills.length > 0) {
    const skillList = skills.map((s) => `- ${s.name}: ${s.description}`).join("\n");
    parts.push(
      `You have access to the following review skills:\n${skillList}\n\nBased on the file content below, choose the most appropriate skill and apply it. Factor in the partner context above where relevant. Do not explain which skill you chose — just deliver the review directly.\n\nIMPORTANT: Respond entirely in Vietnamese.\n\n`
    );
  } else {
    parts.push(`IMPORTANT: Respond entirely in Vietnamese.\n\n`);
  }

  parts.push(`Card context:\n${cardContext}\n\n`);
  parts.push(`File content:\n${content}`);

  return parts.join("");
}

export async function runClaudeReview(
  content: string,
  cardContext: string,
  orgId: string,
  partnerSlug?: string
): Promise<string> {
  const [skills, partner] = await Promise.all([
    db.reviewSkill.findMany({
      where: { orgId, enabled: true },
      orderBy: { order: "asc" },
      select: { name: true, description: true, prompt: true },
    }),
    partnerSlug
      ? db.reviewPartner.findFirst({ where: { orgId, slug: partnerSlug } })
      : Promise.resolve(null),
  ]);

  const prompt = buildPrompt(content, cardContext, skills, partner?.context ?? null);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Anthropic API");
  return block.text.trim();
}
