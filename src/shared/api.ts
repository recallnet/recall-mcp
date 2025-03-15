import { Hex } from "viem";

import { localnet } from "@recallnet/chains";
import {
  RecallClient,
  walletClientFromPrivateKey,
} from "@recallnet/sdk/client";

import type { Context } from "./configuration.js";
import {
  addObject,
  buyCredit,
  createBucket,
  getAccountInfo,
  getCreditInfo,
  getObject,
  getOrCreateBucket,
  listBuckets,
  queryObjects,
} from "./functions.js";
import { jsonStringify } from "./util.js";

/**
 * The Recall API provides a simple interface for the Recall network and SDK, designed for
 * agentic use.
 * @example
 * ```ts
 * const privateKey = "0x...";
 * const recall = new RecallAPI(privateKey);
 * const result = await recall.run("get_account_info", {});
 * ```
 */
class RecallAPI {
  recall: RecallClient;
  context: Context;

  /**
   * Create a new RecallAPI instance.
   * @param privateKey - The private key of the account to use.
   * @param context - The context to use.
   */
  constructor(privateKey: string, context?: Context) {
    const walletClient = walletClientFromPrivateKey(
      privateKey as Hex,
      localnet,
    );
    const recallClient = new RecallClient({ walletClient });

    this.recall = recallClient;
    this.context = context || {};
  }

  /**
   * Run a method on the Recall network.
   * @param method - The method to run.
   * @param arg - The arguments to pass to the method.
   * @returns The result of the method.
   */
  async run(method: string, arg: any) {
    switch (method) {
      case "get_account_info":
        return jsonStringify(
          await getAccountInfo(this.recall, this.context, arg),
        );
      case "list_buckets":
        return jsonStringify(await listBuckets(this.recall, this.context, arg));
      case "get_credit_info":
        return jsonStringify(
          await getCreditInfo(this.recall, this.context, arg),
        );
      case "buy_credit":
        return jsonStringify(await buyCredit(this.recall, this.context, arg));
      case "create_bucket":
        return jsonStringify(
          await createBucket(this.recall, this.context, arg),
        );
      case "get_or_create_bucket":
        return jsonStringify(
          await getOrCreateBucket(this.recall, this.context, arg),
        );
      case "add_object":
        return jsonStringify(await addObject(this.recall, this.context, arg));
      case "get_object":
        return jsonStringify(await getObject(this.recall, this.context, arg));
      case "query_objects":
        return jsonStringify(
          await queryObjects(this.recall, this.context, arg),
        );
      default:
        throw new Error("Invalid method " + method);
    }
  }
}

export default RecallAPI;
