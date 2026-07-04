import { z } from "zod";
import { Department } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateDepartment } from "./schema";

export type InputType = z.infer<typeof CreateDepartment>;
export type ReturnType = ActionState<InputType, Department>;
