import { ActionState } from "@/lib/create-safe-action";

export const callApiAction = async <TInput, TOutput>(
  path: string,
  data: TInput
): Promise<ActionState<TInput, TOutput>> => {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await res.json();
  } catch {
    return { error: "Network error. Please try again." };
  }
};
