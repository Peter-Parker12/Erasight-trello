import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteBoard = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-board", data);
