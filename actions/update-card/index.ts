import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateCard = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-card", data) as Promise<ReturnType>;
