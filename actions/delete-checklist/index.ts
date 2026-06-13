import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteChecklist = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-checklist", data);
