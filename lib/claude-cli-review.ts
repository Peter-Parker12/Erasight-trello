import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const SKILLS_DIR    = process.env.CLAUDE_SKILLS_DIR    ?? "";
const KNOWLEDGE_DIR = process.env.CLAUDE_KNOWLEDGE_DIR ?? "";
const CLAUDE_MODEL  = process.env.CLAUDE_REVIEW_MODEL  ?? "claude-sonnet-4-6";

interface Skill {
  name: string;
  description: string;
  content: string;
}

function readSkills(): Skill[] {
  if (!SKILLS_DIR || !fs.existsSync(SKILLS_DIR)) return [];

  return fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const name    = "/" + f.replace(/\.md$/, "");
      const raw     = fs.readFileSync(path.join(SKILLS_DIR, f), "utf-8");
      const descMatch = raw.match(/description:\s*(.+)/);
      const description = descMatch?.[1]?.trim() ?? "No description";
      return { name, description, content: raw };
    });
}

function readPartnerContext(partnerSlug: string): string | null {
  if (!KNOWLEDGE_DIR || !partnerSlug) return null;
  const filePath = path.join(KNOWLEDGE_DIR, `${partnerSlug}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

function buildPrompt(
  content: string,
  cardContext: string,
  skills: Skill[],
  partnerSlug?: string
): string {
  const partnerContext = partnerSlug ? readPartnerContext(partnerSlug) : null;

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
  partnerSlug?: string
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const skills = readSkills();
  const prompt = buildPrompt(content, cardContext, skills, partnerSlug);

  const message = await client.messages.create({
    model:      CLAUDE_MODEL,
    max_tokens: 4096,
    messages:   [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Anthropic API");
  return block.text.trim();
}
