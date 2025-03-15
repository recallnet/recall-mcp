import { z } from "zod";

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
import {
  addObjectPrompt,
  buyCreditPrompt,
  createBucketPrompt,
  getAccountInfoPrompt,
  getCreditInfoPrompt,
  getObjectPrompt,
  getOrCreateBucketPrompt,
  listBucketsPrompt,
  queryObjectsPrompt,
} from "./prompts.js";

export type Tool = {
  method: string;
  name: string;
  description: string;
  parameters: z.ZodObject<any, any, any, any>;
  actions: {
    [key: string]: {
      [action: string]: boolean;
    };
  };
};

export const tools: Tool[] = [
  {
    method: "get_account_info",
    name: "Get Account Info",
    description: getAccountInfoPrompt,
    parameters: getAccountInfoParameters,
    actions: {
      account: {
        read: true,
      },
    },
  },
  {
    method: "list_buckets",
    name: "List Buckets",
    description: listBucketsPrompt,
    parameters: listBucketsParameters,
    actions: {
      buckets: {
        read: true,
      },
    },
  },
  {
    method: "get_credit_info",
    name: "Get Credit Info",
    description: getCreditInfoPrompt,
    parameters: getCreditInfoParameters,
    actions: {
      account: {
        read: true,
      },
    },
  },
  {
    method: "buy_credit",
    name: "Buy Credit",
    description: buyCreditPrompt,
    parameters: buyCreditParameters,
    actions: {
      account: {
        write: true,
      },
    },
  },
  {
    method: "create_bucket",
    name: "Create Bucket",
    description: createBucketPrompt,
    parameters: createBucketParameters,
    actions: {
      buckets: {
        write: true,
      },
    },
  },
  {
    method: "get_or_create_bucket",
    name: "Get or Create Bucket",
    description: getOrCreateBucketPrompt,
    parameters: getOrCreateBucketParameters,
    actions: {
      buckets: {
        read: true,
        write: true,
      },
    },
  },
  {
    method: "add_object",
    name: "Add Object",
    description: addObjectPrompt,
    parameters: addObjectParameters,
    actions: {
      buckets: {
        write: true,
      },
    },
  },
  {
    method: "get_object",
    name: "Get Object",
    description: getObjectPrompt,
    parameters: getObjectParameters,
    actions: {
      buckets: {
        read: true,
      },
    },
  },
  {
    method: "query_objects",
    name: "Query Objects",
    description: queryObjectsPrompt,
    parameters: queryObjectsParameters,
    actions: {
      buckets: {
        read: true,
      },
    },
  },
];
