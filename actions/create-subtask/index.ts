import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createSubtask = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-subtask", data) as Promise<ReturnType>;
