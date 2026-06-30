import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteKbDocument = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-kb-document", data);
