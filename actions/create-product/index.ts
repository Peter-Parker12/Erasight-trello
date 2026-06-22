import { callApiAction } from "@/lib/fetch-action";
import { InputType, ReturnType } from "./types";

export const createProduct = (data: InputType): Promise<ReturnType> =>
  callApiAction("/api/actions/create-product", data);
