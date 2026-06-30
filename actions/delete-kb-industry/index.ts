import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteKbIndustry = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-kb-industry", data);
