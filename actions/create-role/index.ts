import { callApiAction } from "@/lib/fetch-action";
import type { InputType, ReturnType } from "./types";

export const createRole = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-role", data);
