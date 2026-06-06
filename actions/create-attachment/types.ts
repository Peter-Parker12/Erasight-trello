import { z } from "zod";
import { Attachment } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { CreateAttachment } from "./schema";

export type InputType = z.infer<typeof CreateAttachment>;
export type ReturnType = ActionState<InputType, Attachment>;
