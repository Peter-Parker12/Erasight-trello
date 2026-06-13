import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteList = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-list", data);
