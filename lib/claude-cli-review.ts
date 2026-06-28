import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const SKILLS_DIR = process.env.CLAUDE_SKILLS_DIR ?? "";
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR ?? "";
const KNOWLEDGE_DIR = process.env.CLAUDE_KNOWLEDGE_DIR ?? "";
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
const REVIEW_TIMEOUT_MS = 120_000; // 2 minutes

interface Skill {
  name: string;
  description: string;
}

function readSkills(): Skill[] {
  if (!SKILLS_DIR || !fs.existsSync(SKILLS_DIR)) return [];

  return fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const name = "/" + f.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(SKILLS_DIR, f), "utf-8");
      const descMatch = raw.match(/description:\s*(.+)/);
      const description = descMatch?.[1]?.trim() ?? "No description";
      return { name, description };
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

  const skillList =
    skills.length > 0
      ? skills.map((s) => `- ${s.name}: ${s.description}`).join("\n")
      : null;

  const parts: string[] = [];

  if (partnerContext) {
    parts.push(
      `Partner context — apply this throughout your review:\n${partnerContext}\n\n`
    );
  }

  if (skillList) {
    parts.push(
      `You have access to the following review skills:\n${skillList}\n\nBased on the file content below, choose the most appropriate skill and apply it. Factor in the partner context above where relevant. Do not explain which skill you chose — just deliver the review directly.\n\n`
    );
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
  const skills = readSkills();
  const prompt = buildPrompt(content, cardContext, skills, partnerSlug);

  return new Promise((resolve, reject) => {
    const cwd = PROJECT_DIR || process.cwd();

    const child = spawn(CLAUDE_BIN, ["-p", "--print"], {
      cwd,
      env: {
        ...process.env,
        HOME: PROJECT_DIR || "/opt/claude-reviewer",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Claude CLI timed out after 2 minutes"));
    }, REVIEW_TIMEOUT_MS);

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 || stdout.trim()) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr.trim()}`));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Claude CLI: ${err.message}`));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
