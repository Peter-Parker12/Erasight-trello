import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteCard = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-card", data) as Promise<ReturnType>;
