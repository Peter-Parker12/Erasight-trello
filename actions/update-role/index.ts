import { callApiAction } from "@/lib/fetch-action";
import type { InputType, ReturnType } from "./types";

export const updateRole = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-role", data);
