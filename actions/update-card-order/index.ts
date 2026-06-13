import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateCardOrder = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-card-order", data) as Promise<ReturnType>;
