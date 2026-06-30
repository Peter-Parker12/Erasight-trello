import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteKbFolder = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-kb-folder", data);
