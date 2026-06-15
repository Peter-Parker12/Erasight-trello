import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteCompany = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-company", data);
