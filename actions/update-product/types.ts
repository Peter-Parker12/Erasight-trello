import { z } from "zod";
import { Product } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { UpdateProduct } from "./schema";

export type InputType = z.infer<typeof UpdateProduct>;
export type ReturnType = ActionState<InputType, Product>;
