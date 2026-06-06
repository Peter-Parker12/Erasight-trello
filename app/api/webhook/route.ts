import { NextResponse } from "next/server";

// Stripe webhooks are not used in this project.
export async function POST() {
  return new NextResponse("Stripe not configured", { status: 400 });
}
