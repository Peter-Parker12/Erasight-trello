import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const toggleCardWatch = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/toggle-card-watch", data) as Promise<ReturnType>;
