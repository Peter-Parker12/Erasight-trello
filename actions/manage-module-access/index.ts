import { callApiAction } from "@/lib/fetch-action";
import type { AddInputType, AddReturnType, RemoveInputType, RemoveReturnType } from "./types";

export const addModuleAccess = (data: AddInputType): Promise<AddReturnType> =>
  callApiAction("/api/actions/manage-module-access/add", data);

export const removeModuleAccess = (data: RemoveInputType): Promise<RemoveReturnType> =>
  callApiAction("/api/actions/manage-module-access/remove", data);
