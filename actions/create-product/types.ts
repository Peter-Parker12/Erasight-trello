import { z } from "zod";
import { Product } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateProduct } from "./schema";

export type InputType = z.infer<typeof CreateProduct>;
export type ReturnType = ActionState<InputType, Product>;
