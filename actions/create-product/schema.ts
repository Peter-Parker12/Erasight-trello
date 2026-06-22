import { z } from "zod";
import { productBaseFields } from "@/lib/crm-schemas";

export const CreateProduct = z.object(productBaseFields);
