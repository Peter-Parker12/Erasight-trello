import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { isOrgAdmin } from "@/lib/board-access";
import { parseWorkbook } from "@/lib/okr-import/parse-workbook";
import { computeImportPreview, commitImport } from "@/lib/okr-import/commit-import";
import { NameMapping } from "@/lib/okr-import/types";

export const maxDuration = 60;

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await isOrgAdmin(orgId);
  if (!admin) return NextResponse.json({ error: "Only admins can import workbooks." }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 10 MB limit." }, { status: 413 });
  }

  const yearRaw = formData.get("year");
  const year = parseInt(String(yearRaw ?? ""), 10);
  if (!Number.isFinite(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseWorkbook(buffer);
  } catch {
    return NextResponse.json({ error: "Could not parse the workbook. Is it a valid .xlsx file?" }, { status: 400 });
  }

  const commit = new URL(req.url).searchParams.get("commit") === "1";

  if (!commit) {
    const preview = await computeImportPreview(orgId, parsed);
    return NextResponse.json(preview);
  }

  let nameMapping: NameMapping = {};
  const nameMappingRaw = formData.get("nameMapping");
  if (typeof nameMappingRaw === "string" && nameMappingRaw) {
    try {
      nameMapping = JSON.parse(nameMappingRaw);
    } catch {
      return NextResponse.json({ error: "Invalid nameMapping payload." }, { status: 400 });
    }
  }

  const counts = await commitImport(orgId, parsed, nameMapping, userId, year);
  return NextResponse.json({ counts });
}
