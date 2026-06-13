import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateChecklistItem = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-checklist-item", data);
