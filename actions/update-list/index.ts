import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateList = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-list", data);
