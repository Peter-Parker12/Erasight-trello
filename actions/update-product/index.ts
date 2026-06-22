import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const updateProduct = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/update-product", data);
