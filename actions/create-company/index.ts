import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createCompany = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-company", data);
