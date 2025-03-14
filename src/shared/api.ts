import { Hex } from "viem";

import { localnet } from "@recallnet/chains";
import {
  RecallClient,
  walletClientFromPrivateKey,
} from "@recallnet/sdk/client";

import type { Context } from "./configuration.js";
import { getAccountInfo } from "./functions.js";

class RecallAPI {
  recall: RecallClient;
  context: Context;

  constructor(privateKey: string, context?: Context) {
    const walletClient = walletClientFromPrivateKey(
      privateKey as Hex,
      localnet,
    );
    const recallClient = new RecallClient({ walletClient });

    this.recall = recallClient;
    this.context = context || {};
  }

  async run(method: string, arg: any) {
    if (method === "get_account_info") {
      const output = JSON.stringify(
        await getAccountInfo(this.recall, this.context, arg),
      );
      return output;
    } else {
      throw new Error("Invalid method " + method);
    }
  }
}

export default RecallAPI;
