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
 * Serialized account information with balance and parent balance as strings
 */
type SerializedAccountInfo = Omit<AccountInfo, "balance" | "parentBalance"> & {
  // Balances are bigints and cannot be serialized to JSON, so we convert them to strings
  balance: string;
  parentBalance?: string;
};

type SerializedQueryResult = Omit<QueryResult, "objects"> & {
  objects: {
    key: string;
    state: Omit<QueryResult["objects"][number]["state"], "size"> & {
      size: string;
    };
  }[];
};

// TODO: determine if there's a better way to handling bigints to strings
type SerializedCreditAccount = Omit<
  CreditAccount,
  | "creditFree"
  | "creditCommitted"
  | "lastDebitEpoch"
  | "approvalsTo"
  | "approvalsFrom"
  | "maxTtl"
  | "gasAllowance"
> & {
  creditFree: string;
  creditCommitted: string;
  lastDebitEpoch: string;
  approvalsTo: readonly {
    addr: `0x${string}`;
    approval: {
      creditLimit: string;
      gasFeeLimit: string;
      expiry: string;
      creditUsed: string;
      gasFeeUsed: string;
    };
  }[];
  approvalsFrom: readonly {
    addr: `0x${string}`;
    approval: {
      creditLimit: string;
      gasFeeLimit: string;
      expiry: string;
      creditUsed: string;
      gasFeeUsed: string;
    };
  }[];
  maxTtl: string;
  gasAllowance: string;
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

export const getCreditInfo = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof getCreditInfoParameters>,
): Promise<SerializedCreditAccount | string> => {
  try {
    const address = params.address ? (params.address as Address) : undefined;
    const { result } = await recall.creditManager().getAccount(address);
    return {
      ...result,
      creditFree: result.creditFree.toString(),
      creditCommitted: result.creditCommitted.toString(),
      lastDebitEpoch: result.lastDebitEpoch.toString(),
      approvalsTo: result.approvalsTo.map((approval) => ({
        ...approval,
        approval: {
          ...approval.approval,
          creditLimit: approval.approval.creditLimit.toString(),
          gasFeeLimit: approval.approval.gasFeeLimit.toString(),
          expiry: approval.approval.expiry.toString(),
          creditUsed: approval.approval.creditUsed.toString(),
          gasFeeUsed: approval.approval.gasFeeUsed.toString(),
        },
      })),
      approvalsFrom: result.approvalsFrom.map((approval) => ({
        ...approval,
        approval: {
          ...approval.approval,
          creditLimit: approval.approval.creditLimit.toString(),
          gasFeeLimit: approval.approval.gasFeeLimit.toString(),
          expiry: approval.approval.expiry.toString(),
          creditUsed: approval.approval.creditUsed.toString(),
          gasFeeUsed: approval.approval.gasFeeUsed.toString(),
        },
      })),
      maxTtl: result.maxTtl.toString(),
      gasAllowance: result.gasAllowance.toString(),
    };
  } catch (error: any) {
    return "Failed to get credit info";
  }
};

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

export const queryObjects = async (
  recall: RecallClient,
  context: Context,
  params: z.infer<typeof queryObjectsParameters>,
): Promise<SerializedQueryResult | string> => {
  try {
    const { result } = await recall
      .bucketManager()
      .query(params.bucket as Address, {
        prefix: params.prefix,
        delimiter: params.delimiter,
        startKey: params.startKey,
        limit: params.limit,
      });
    // Convert `size` to string
    const serializedResult = {
      ...result,
      objects: result.objects.map((obj) => ({
        ...obj,
        state: { ...obj.state, size: obj.state.size.toString() },
      })),
    };
    return serializedResult;
  } catch (error: any) {
    return "Failed to query objects";
  }
};
