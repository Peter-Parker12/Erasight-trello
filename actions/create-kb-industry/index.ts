import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createKbIndustry = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-kb-industry", data);
