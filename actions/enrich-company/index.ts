import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const enrichCompany = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/enrich-company", data);
