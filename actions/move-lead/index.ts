import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const moveLead = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/move-lead", data);
