import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateBundle = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-bundle", data);
