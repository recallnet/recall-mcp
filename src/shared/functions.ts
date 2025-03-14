import { Address } from "viem";
import { z } from "zod";

import { AccountInfo } from "@recallnet/sdk/account";
import { RecallClient } from "@recallnet/sdk/client";

import type { Context } from "./configuration.js";
import { getAccountInfoParameters } from "./parameters.js";

type SerializedAccountInfo = Omit<AccountInfo, "balance" | "parentBalance"> & {
  balance: string;
  parentBalance?: string;
};

/**
 * Gets the account information for the current user.
 * @returns The account information.
 */
export const getAccountInfo = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof getAccountInfoParameters>,
): Promise<SerializedAccountInfo | string> => {
  try {
    const address = params.address ? (params.address as Address) : undefined;
    const { result: info } = await recall.accountManager().info(address);
    return {
      ...info,
      balance: info.balance.toString(),
      parentBalance: info.parentBalance?.toString(),
    };
  } catch (error: any) {
    return "Failed to get account info";
  }
};
