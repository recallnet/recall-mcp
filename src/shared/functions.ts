import { Address, parseEther } from "viem";
import { z } from "zod";

import { AccountInfo } from "@recallnet/sdk/account";
import { ListResult, QueryResult } from "@recallnet/sdk/bucket";
import { RecallClient } from "@recallnet/sdk/client";
import { CreditAccount } from "@recallnet/sdk/credit";

import type { Context } from "./configuration.js";
import {
  addObjectParameters,
  buyCreditParameters,
  createBucketParameters,
  getAccountInfoParameters,
  getCreditInfoParameters,
  getObjectParameters,
  getOrCreateBucketParameters,
  listBucketsParameters,
  queryObjectsParameters,
} from "./parameters.js";

/**
 * Gets the account information for the current user.
 * @returns The account information.
 */
export const getAccountInfo = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof getAccountInfoParameters>,
): Promise<AccountInfo | string> => {
  try {
    const address = params.address ? (params.address as Address) : undefined;
    const { result: info } = await recall.accountManager().info(address);
    return info;
  } catch (error: any) {
    return "Failed to get account info";
  }
};

/**
 * Lists all buckets for the current user.
 * @returns The list of buckets.
 */
export const listBuckets = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof listBucketsParameters>,
): Promise<ListResult | string> => {
  try {
    const address = params.address ? (params.address as Address) : undefined;
    const { result } = await recall.bucketManager().list(address);
    return result;
  } catch (error: any) {
    return "Failed to list buckets";
  }
};

/**
 * Gets the credit information for the current user.
 * @returns The credit information.
 */
export const getCreditInfo = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof getCreditInfoParameters>,
): Promise<CreditAccount | string> => {
  try {
    const address = params.address ? (params.address as Address) : undefined;
    const { result } = await recall.creditManager().getAccount(address);
    return result;
  } catch (error: any) {
    return "Failed to get credit info";
  }
};

/**
 * Buys credit for the current user.
 * @returns The transaction hash of the credit purchase.
 */
export const buyCredit = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof buyCreditParameters>,
): Promise<string> => {
  try {
    const to = params.to ? (params.to as Address) : undefined;
    const { meta } = await recall
      .creditManager()
      .buy(parseEther(params.amount), to);
    return meta?.tx?.transactionHash ?? "Failed to buy credit";
  } catch (error: any) {
    return "Failed to buy credit";
  }
};

/**
 * Creates a new bucket for the current user.
 * @returns The bucket address and transaction hash.
 */
export const createBucket = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof createBucketParameters>,
): Promise<{ bucket: Address; tx: string } | string> => {
  try {
    const metadata = params.metadata ?? {};
    const { meta, result } = await recall.bucketManager().create({
      metadata: { alias: params.bucketAlias, ...metadata },
    });
    if (!meta?.tx || !result) {
      return "Failed to create bucket";
    }
    return {
      bucket: result.bucket,
      tx: meta.tx.transactionHash,
    };
  } catch (error: any) {
    return "Failed to create bucket";
  }
};

/**
 * Gets or creates a bucket for the current user.
 * @returns The bucket address and transaction hash.
 */
export const getOrCreateBucket = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof getOrCreateBucketParameters>,
): Promise<{ bucket: Address; tx: string } | string> => {
  try {
    // Try to find the bucket by alias
    const buckets = await recall.bucketManager().list();
    if (buckets?.result) {
      const bucket = buckets.result.find(
        (b) => b.metadata?.alias === params.bucketAlias,
      );
      if (bucket) {
        return bucket.addr;
      }
    }

    // Create new bucket if not found
    const metadata = params.metadata ?? {};
    const { result, meta } = await recall.bucketManager().create({
      metadata: { alias: params.bucketAlias, ...metadata },
    });
    if (!meta?.tx || !result) {
      return "Failed to create bucket";
    }
    return { bucket: result.bucket, tx: meta.tx.transactionHash };
  } catch (error: any) {
    return "Failed to get or create bucket";
  }
};

/**
 * Adds an object to a bucket.
 * @returns The transaction hash of the object addition.
 */
export const addObject = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof addObjectParameters>,
): Promise<string> => {
  try {
    const metadata = params.metadata ?? {};
    const dataToStore =
      typeof params.data === "string"
        ? new TextEncoder().encode(params.data)
        : params.data;

    const { meta, result } = await recall
      .bucketManager()
      .add(params.bucket as Address, params.key, dataToStore, {
        overwrite: params.overwrite ?? false,
        metadata: { ...metadata },
      });
    if (!meta?.tx) {
      return "Failed to add object";
    }
    return meta.tx.transactionHash;
  } catch (error: any) {
    return "Failed to add object";
  }
};

/**
 * Gets an object from a bucket.
 * @returns The object.
 */
export const getObject = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof getObjectParameters>,
): Promise<Uint8Array | string> => {
  try {
    const { result } = await recall
      .bucketManager()
      .get(params.bucket as Address, params.key);

    if (!result) {
      return "Object not found";
    }

    return params.outputType === "string"
      ? new TextDecoder().decode(result)
      : result;
  } catch (error: any) {
    return "Failed to get object";
  }
};

/**
 * Queries objects in a bucket.
 * @returns The query result.
 */
export const queryObjects = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof queryObjectsParameters>,
): Promise<QueryResult | string> => {
  try {
    const { result } = await recall
      .bucketManager()
      .query(params.bucket as Address, {
        prefix: params.prefix,
        delimiter: params.delimiter,
        startKey: params.startKey,
        limit: params.limit,
      });
    return result;
  } catch (error: any) {
    return "Failed to query objects";
  }
};
