import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createApiKey = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-api-key", data);
