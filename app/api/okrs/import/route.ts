import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { parseWorkbook } from "@/lib/okr-import/parse-workbook";
import { computeImportPreview, commitImport } from "@/lib/okr-import/commit-import";
import { NameMapping } from "@/lib/okr-import/types";

export const maxDuration = 90;

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

  const departments = await db.department.findMany({ where: { orgId }, select: { name: true } });
  const departmentNames = departments.map((d) => d.name);

  let parsed;
  try {
    parsed = parseWorkbook(buffer, departmentNames);
  } catch {
    return NextResponse.json({ error: "Could not parse the workbook. Is it a valid .xlsx file?" }, { status: 400 });
  }

  const commit = new URL(req.url).searchParams.get("commit") === "1";

  if (!commit) {
    try {
      const preview = await computeImportPreview(orgId, parsed);
      return NextResponse.json(preview);
    } catch (error) {
      console.error("[OKR_IMPORT_PREVIEW_ERROR]", error);
      const message = error instanceof Error ? error.message : "Failed to build preview.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
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

  const user = await currentUser();
  const actor = {
    userId,
    userName: `${user?.firstName ?? ""}${user?.lastName ? ` ${user.lastName}` : ""}`.trim() || "Unknown",
    userImage: user?.imageUrl ?? "",
  };

  try {
    const counts = await commitImport(orgId, parsed, nameMapping, actor, year);
    return NextResponse.json({ counts });
  } catch (error) {
    console.error("[OKR_IMPORT_COMMIT_ERROR]", error);
    const message = error instanceof Error ? error.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
