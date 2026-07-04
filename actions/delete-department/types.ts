import { z } from "zod";
import { Department } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { DeleteDepartment } from "./schema";

export type InputType = z.infer<typeof DeleteDepartment>;
export type ReturnType = ActionState<InputType, Department>;
