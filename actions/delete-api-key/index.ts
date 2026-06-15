import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteApiKey = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-api-key", data);
