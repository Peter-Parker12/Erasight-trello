import { callApiAction } from "@/lib/fetch-action";
import type { InputType, ReturnType } from "./types";

export const upsertListTransitionRule = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/upsert-list-transition-rule", data);
