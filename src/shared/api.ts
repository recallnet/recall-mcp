import { Hex } from "viem";

import {
  ChainName,
  checkChainName,
  getChain,
  testnet,
} from "@recallnet/chains";
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

// TODOs:
// - add documentation resource
// - consider other actions, like transferring tokens
// - consider `.env` patterns for private keys
// - implement langchain or other adapters
// - figure out barrel file exports

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
  serialize: (data: any) => string;

  /**
   * Create a new RecallAPI instance.
   * @param privateKey - The private key of the account to use.
   * @param context - The context to use, including the network name (e.g., `testnet` or `localnet`).
   * @param serializer - The serializer to use, which formats the return value of the method.
   * Defaults to `jsonStringify` (i.e.,`JSON.stringify` with `bigint`s converted to strings).
   */
  constructor(
    privateKey: string,
    context?: Context,
    serializer: (data: any) => string = jsonStringify,
  ) {
    const chain =
      context?.network !== undefined &&
      checkChainName(context.network as ChainName)
        ? getChain(context.network as ChainName)
        : testnet;
    const walletClient = walletClientFromPrivateKey(privateKey as Hex, chain);
    const recallClient = new RecallClient({ walletClient });

    this.recall = recallClient;
    this.context = context || {};
    this.serialize = serializer;
  }

  /**
   * Run a method on the Recall network.
   * @param method - The method to run.
   * @param arg - The arguments to pass to the method.
   * @returns The result of the method.
   */
  async run(method: string, arg: any) {
    switch (method) {
      // Account read methods
      case "get_account_info":
        return this.serialize(
          await getAccountInfo(this.recall, this.context, arg),
        );
      case "get_credit_info":
        return this.serialize(
          await getCreditInfo(this.recall, this.context, arg),
        );
      // Account write methods
      case "buy_credit":
        return this.serialize(await buyCredit(this.recall, this.context, arg));
      // Bucket read methods
      case "list_buckets":
        return this.serialize(
          await listBuckets(this.recall, this.context, arg),
        );
      case "get_object":
        return this.serialize(await getObject(this.recall, this.context, arg));
      case "query_objects":
        return this.serialize(
          await queryObjects(this.recall, this.context, arg),
        );
      // Bucket write methods
      case "create_bucket":
        return this.serialize(
          await createBucket(this.recall, this.context, arg),
        );
      case "get_or_create_bucket":
        return this.serialize(
          await getOrCreateBucket(this.recall, this.context, arg),
        );
      case "add_object":
        return this.serialize(await addObject(this.recall, this.context, arg));
      default:
        throw new Error(`Invalid method: ${method}`);
    }
  }
}

export default RecallAPI;
