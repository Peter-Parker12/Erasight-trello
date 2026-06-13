import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const copyList = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/copy-list", data);
