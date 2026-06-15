import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteContact = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-contact", data);
