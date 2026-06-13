import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const saveCardTemplate = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/save-card-template", data) as Promise<ReturnType>;
