import { z } from "zod";

// Account operations
export const AccountInfoSchema = {};

export const CreditInfoSchema = {};

export const BuyCreditSchema = {
  amount: z.string().min(1),
};

// Bucket operations
export const ListBucketsSchema = {};

export const CreateBucketSchema = {
  alias: z.string().min(1),
};

// Object operations
export const GetObjectSchema = {
  bucket: z.string().min(1),
  key: z.string().min(1),
};

export const AddObjectSchema = {
  bucket: z.string().min(1),
  key: z.string().min(1),
  data: z.string().min(1),
  overwrite: z.boolean().optional(),
};

// Security related operations
export const SecuritySchema = {
  query: z.string().min(1),
};
