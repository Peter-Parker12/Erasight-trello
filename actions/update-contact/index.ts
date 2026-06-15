import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateContact = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-contact", data);
