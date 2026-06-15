import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateCustomField = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-custom-field", data);
