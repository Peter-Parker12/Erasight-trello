import { callApiAction } from "@/lib/fetch-action";
import type { InputType, ReturnType } from "./types";

export const deleteRole = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-role", data);
