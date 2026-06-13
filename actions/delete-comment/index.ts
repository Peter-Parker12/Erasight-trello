import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteComment = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-comment", data);
