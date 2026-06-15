import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateLead = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-lead", data);
