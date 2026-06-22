import { z } from "zod";
import { ProductBundle } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateBundle } from "./schema";

export type InputType = z.infer<typeof UpdateBundle>;
export type ReturnType = ActionState<InputType, ProductBundle>;
