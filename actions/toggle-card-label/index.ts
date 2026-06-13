import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const toggleCardLabel = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/toggle-card-label", data) as Promise<ReturnType>;
