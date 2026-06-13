import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateListOrder = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-list-order", data);
