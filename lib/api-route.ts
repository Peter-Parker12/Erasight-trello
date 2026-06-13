import { NextResponse } from "next/server";

import { ActionState } from "@/lib/create-safe-action";

export const toApiRoute = <TInput, TOutput>(
  action: (data: TInput) => Promise<ActionState<TInput, TOutput>>
) => {
  return async (req: Request) => {
    try {
      const data = await req.json();
      const result = await action(data);
      return NextResponse.json(result);
    } catch (error) {
      console.error("[API_ACTION_ERROR]", error);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
};
