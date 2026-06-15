import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createCustomField = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-custom-field", data);
