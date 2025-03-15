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
    switch (method) {
      case "get_account_info":
        return JSON.stringify(
          await getAccountInfo(this.recall, this.context, arg),
        );
      case "list_buckets":
        return JSON.stringify(
          await listBuckets(this.recall, this.context, arg),
        );
      case "get_credit_info":
        return JSON.stringify(
          await getCreditInfo(this.recall, this.context, arg),
        );
      case "buy_credit":
        return JSON.stringify(await buyCredit(this.recall, this.context, arg));
      case "create_bucket":
        return JSON.stringify(
          await createBucket(this.recall, this.context, arg),
        );
      case "get_or_create_bucket":
        return JSON.stringify(
          await getOrCreateBucket(this.recall, this.context, arg),
        );
      case "add_object":
        return JSON.stringify(await addObject(this.recall, this.context, arg));
      case "get_object":
        return JSON.stringify(await getObject(this.recall, this.context, arg));
      case "query_objects":
        return JSON.stringify(
          await queryObjects(this.recall, this.context, arg),
        );
      default:
        throw new Error("Invalid method " + method);
    }
  }
}

export default RecallAPI;
