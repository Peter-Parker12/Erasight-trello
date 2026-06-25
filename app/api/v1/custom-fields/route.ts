import { NextResponse } from "next/server";
import { Prisma, type CrmEntityType } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { CustomFieldOptions } from "@/lib/custom-fields";

const CreateFieldBody = z.object({
  entityType: z.enum(["COMPANY", "CONTACT", "LEAD", "PRODUCT"]),
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must be alphanumeric + underscore, start with a letter."),
  label: z.string().min(1).max(120),
  fieldType: z.enum([
    "TEXT",
    "NUMBER",
    "BOOLEAN",
    "DATE",
    "SELECT",
    "MULTI_SELECT",
    "CURRENCY",
    "EMAIL",
    "PHONE",
    "URL",
  ]),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  options: z.array(z.string()).optional(),
});

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 500);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const where = {
    orgId: auth.apiKey.orgId,
    ...(entityType ? { entityType: entityType as CrmEntityType } : {}),
  };

  const [data, total] = await Promise.all([
    db.customFieldDefinition.findMany({ where, orderBy: { order: "asc" }, take: limit, skip: offset }),
    db.customFieldDefinition.count({ where }),
  ]);

  return NextResponse.json({ data, meta: { limit, offset, total } });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateFieldBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { options, ...fields } = parsed.data;

  // Auto-assign order if not provided.
  let order = fields.order;
  if (order === undefined) {
    const last = await db.customFieldDefinition.findFirst({
      where: { orgId: auth.apiKey.orgId, entityType: fields.entityType },
      orderBy: { order: "desc" },
    });
    order = (last?.order ?? -1) + 1;
  }

  try {
    const definition = await db.customFieldDefinition.create({
      data: {
        orgId: auth.apiKey.orgId,
        ...fields,
        order,
        options: options ? ({ options } satisfies CustomFieldOptions as Prisma.InputJsonObject) : Prisma.JsonNull,
      },
    });
    return NextResponse.json({ data: definition }, { status: 201 });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A field with this key already exists for this entity type." },
        { status: 422 },
      );
    }
    throw err;
  }
};
