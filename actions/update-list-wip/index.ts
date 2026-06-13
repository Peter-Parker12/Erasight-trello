import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateListWip = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-list-wip", data);
