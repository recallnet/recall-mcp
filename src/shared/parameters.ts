import { z } from "zod";

/**
 * Parameters for the getAccountInfo function
 */
export const getAccountInfoParameters = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .describe("The address of the account (EVM hex string address)"),
});

/**
 * Parameters for the listBuckets function
 */
export const listBucketsParameters = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .describe(
      "The address of the account to list buckets for (EVM hex string address)",
    ),
});

/**
 * Parameters for the getCreditInfo function
 */
export const getCreditInfoParameters = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .describe("The address of the account (EVM hex string address)"),
});

/**
 * Parameters for the buyCredit function
 */
export const buyCreditParameters = z.object({
  amount: z.string().describe("The amount of credit to buy"),
  to: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .describe(
      "The address of the account to buy credit for (EVM hex string address)",
    ),
});

/**
 * Parameters for the createBucket function
 */
export const createBucketParameters = z.object({
  bucketAlias: z.string().describe("The alias of the bucket to create"),
  metadata: z
    .record(z.string(), z.string())
    .optional()
    .describe("The metadata to store with the bucket"),
});

/**
 * Parameters for the getOrCreateBucket function
 */
export const getOrCreateBucketParameters = z.object({
  bucketAlias: z
    .string()
    .describe("The alias of the bucket to retrieve or create"),
  metadata: z
    .record(z.string(), z.string())
    .optional()
    .describe("The metadata to store with the bucket"),
});

/**
 * Parameters for the addObject function
 */
export const addObjectParameters = z.object({
  bucket: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("The address of the bucket"),
  key: z.string().describe("The key under which to store the object"),
  data: z
    .union([z.string(), z.instanceof(Uint8Array)])
    .describe("The data to store as a string or Uint8Array"),
  metadata: z
    .record(z.string(), z.string())
    .optional()
    .describe("The metadata to store with the object"),
  overwrite: z
    .boolean()
    .optional()
    .describe("Whether to overwrite existing data at that key"),
});

/**
 * Parameters for the getObject function
 */
export const getObjectParameters = z.object({
  bucket: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("The address of the bucket"),
  key: z.string().describe("The key under which the object is stored"),
  outputType: z
    .enum(["string", "uint8array"])
    .optional()
    .describe("The type of the output (default: uint8array)"),
});

/**
 * Parameters for the queryObjects function
 */
export const queryObjectsParameters = z.object({
  bucket: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .describe("The address of the bucket"),
  prefix: z.string().optional().describe("The prefix of the objects to query"),
  delimiter: z
    .string()
    .optional()
    .describe("The delimiter of the objects to query"),
  startKey: z
    .string()
    .optional()
    .describe("The starting key of the objects to query"),
  limit: z
    .number()
    .optional()
    .describe("The maximum number of objects to query"),
});
