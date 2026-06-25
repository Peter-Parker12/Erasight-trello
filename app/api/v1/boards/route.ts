import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

const CreateBoardBody = z.object({
  title: z.string().min(1).max(120),
  backgroundType: z.enum(["image", "color"]).optional(),
  backgroundColor: z.string().max(20).optional(),
  // Pipe-delimited image descriptor as used by the internal create-board
  // action: "imageId|thumbUrl|fullUrl|linkHtml|userName". When omitted the
  // board is created with a plain color background.
  image: z.string().optional(),
});

export const GET = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const where = { orgId: auth.apiKey.orgId };

  const [data, total] = await Promise.all([
    db.board.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.board.count({ where }),
  ]);

  return NextResponse.json({ data, meta: { limit, offset, total } });
};

export const POST = async (req: Request) => {
  const auth = await authenticateApiRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (body === null) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const parsed = CreateBoardBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 422 });
  }

  const { title, image, backgroundType, backgroundColor } = parsed.data;

  let imageData: {
    imageId: string;
    imageThumbUrl: string;
    imageFullUrl: string;
    imageUserName: string;
    imageLinkHtml: string;
  };

  if (image) {
    const [imageId, imageThumbUrl, imageFullUrl, imageLinkHtml, imageUserName] = image.split("|");
    if (!imageId || !imageThumbUrl || !imageFullUrl || !imageLinkHtml || !imageUserName) {
      return NextResponse.json(
        { error: "Image descriptor must be 'imageId|thumbUrl|fullUrl|linkHtml|userName'." },
        { status: 422 },
      );
    }
    imageData = { imageId, imageThumbUrl, imageFullUrl, imageLinkHtml, imageUserName };
  } else {
    imageData = {
      imageId: "",
      imageThumbUrl: "",
      imageFullUrl: "",
      imageLinkHtml: "",
      imageUserName: "",
    };
  }

  const board = await db.board.create({
    data: {
      orgId: auth.apiKey.orgId,
      title,
      backgroundType: backgroundType ?? (image ? "image" : "color"),
      backgroundColor: backgroundColor ?? null,
      ...imageData,
    },
  });

  return NextResponse.json({ data: board }, { status: 201 });
};
