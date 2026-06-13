import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteChecklistItem = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-checklist-item", data);
