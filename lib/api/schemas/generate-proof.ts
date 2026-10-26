import { z } from "zod";

import { AddressSchema, NumericStringSchema } from "./common";

export const GenerateProofInputSchema = z.object({
  account: AddressSchema,
  delegate: AddressSchema,
  stake: NumericStringSchema,
  fees: NumericStringSchema,
});

export const GenerateProofOutputSchema = z.array(z.string());
