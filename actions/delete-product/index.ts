import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const deleteProduct = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/delete-product", data);
