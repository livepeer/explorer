import { z } from "zod";

import { AddressSchema } from "./common";

const NumericStringSchema = z.string().regex(/^\d+$/, {
  message: "Must be a numeric string",
});

export const GenerateProofInputSchema = z.object({
  account: AddressSchema,
  delegate: AddressSchema,
  stake: NumericStringSchema,
  fees: NumericStringSchema,
});
