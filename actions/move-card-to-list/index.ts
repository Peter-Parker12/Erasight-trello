import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const moveCardToList = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/move-card-to-list", data) as Promise<ReturnType>;
