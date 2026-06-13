import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateCardDates = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-card-dates", data) as Promise<ReturnType>;
