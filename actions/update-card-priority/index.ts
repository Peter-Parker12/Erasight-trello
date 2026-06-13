import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateCardPriority = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-card-priority", data) as Promise<ReturnType>;
