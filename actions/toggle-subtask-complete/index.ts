import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const toggleSubtaskComplete = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/toggle-subtask-complete", data) as Promise<ReturnType>;
