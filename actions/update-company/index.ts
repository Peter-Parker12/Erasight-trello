import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateCompany = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-company", data);
