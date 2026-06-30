import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { extractFileContent } from "@/lib/extract-file-content";
import { runClaudeReview } from "@/lib/claude-cli-review";
import { notifyReviewReady } from "@/lib/board-telegram";

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attachmentId, cardId, boardId, partnerSlug } = await req.json();
    if (!attachmentId || !cardId || !boardId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const attachment = await db.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        card: {
          include: { list: { include: { board: true } } },
        },
      },
    });

    if (!attachment || attachment.card.list.board.orgId !== orgId) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const card = attachment.card;
    const cardContext = [
      `Title: ${card.title}`,
      card.description ? `Description: ${card.description}` : null,
      card.dueDate ? `Due date: ${card.dueDate.toISOString().split("T")[0]}` : null,
      card.priority !== "NONE" ? `Priority: ${card.priority}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const content = await extractFileContent(attachment.url);

    if (!content.trim()) {
      return NextResponse.json({ error: "Could not extract any text content from the file" }, { status: 422 });
    }

    const review = await runClaudeReview(content, cardContext, partnerSlug);

    const updated = await db.attachment.update({
      where: { id: attachmentId },
      data: { review, reviewedAt: new Date() },
    });

    // Send review to Telegram (non-blocking — UI response doesn't wait for this)
    void notifyReviewReady({
      boardId: card.list.board.id,
      cardId: card.id,
      cardTitle: card.title,
      attachmentName: attachment.name,
      reviewText: review,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[REVIEW_ATTACHMENT_ERROR]", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
