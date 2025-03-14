import { z } from "zod";

export const getAccountInfoParameters = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("The address of the account (EVM hex string address)")
    .optional(),
});
