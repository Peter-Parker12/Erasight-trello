import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createComment = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-comment", data);
