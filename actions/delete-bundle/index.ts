import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteBundle = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-bundle", data);
