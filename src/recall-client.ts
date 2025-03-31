import { ChainName, getChain, testnet } from '@recallnet/chains';
import { AccountInfo } from '@recallnet/sdk/account';
import { ListResult } from '@recallnet/sdk/bucket';
import { RecallClient, walletClientFromPrivateKey } from '@recallnet/sdk/client';
import { CreditAccount } from '@recallnet/sdk/credit';
import { Address, Hex, parseEther, TransactionReceipt } from 'viem';
import { validateEnv, logger, getPrivateKey, config } from './env.js';

type Result<T = unknown> = {
  result: T;
  meta?: {
    tx?: TransactionReceipt;
  };
};

export class RecallClientManager {
  private client: RecallClient;
  private static instance: RecallClientManager;

  private constructor() {
    // Make sure environment variables are loaded and valid
    validateEnv();
    
    const privateKeyRaw = getPrivateKey();
    const network = config.RECALL_NETWORK || 'testnet';

    if (!privateKeyRaw) {
      throw new Error('RECALL_PRIVATE_KEY is required');
    }

    // Format the private key: If it doesn't start with "0x", prepend it
    const privateKey = privateKeyRaw.startsWith('0x') 
      ? privateKeyRaw as Hex 
      : `0x${privateKeyRaw}` as Hex;

    const chain = network ? getChain(network as ChainName) : testnet;
    
    // Remove the private key from the environment after use to minimize risk of exposure
    const walletKey = privateKey;
    
    const wallet = walletClientFromPrivateKey(walletKey, chain);
    this.client = new RecallClient({ walletClient: wallet });
  }

  public static getInstance(): RecallClientManager {
    if (!RecallClientManager.instance) {
      RecallClientManager.instance = new RecallClientManager();
    }
    return RecallClientManager.instance;
  }

  /**
   * Protect against accidental exposure of environment variables or sensitive data
   * This method will throw an error if called
   */
  public getEnvironmentVariables(): never {
    throw new Error('Security violation: This method is designed to prevent accidental exposure of sensitive environment variables.');
  }

  /**
   * Protect against accidental exposure of private keys
   * This method will throw an error if called
   */
  public getPrivateKey(): never {
    throw new Error('Security violation: This method is designed to prevent accidental exposure of private keys.');
  }

  /**
   * Utility function to handle timeouts for async operations.
   * @param promise The promise to execute.
   * @param timeoutMs The timeout in milliseconds.
   * @param operationName The name of the operation for logging.
   * @returns The result of the promise.
   */
  async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${operationName} operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  /**
   * Gets the account information for the current user.
   * @returns The account information.
   */
  public async getAccountInfo(): Promise<AccountInfo> {
    try {
      const info = await this.client.accountManager().info();
      return info.result;
    } catch (error: any) {
      logger.error(`Error getting account info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lists all buckets in Recall.
   * @returns The list of buckets.
   */
  public async listBuckets(): Promise<ListResult> {
    try {
      const info = await this.client.bucketManager().list();
      return info.result;
    } catch (error: any) {
      logger.error(`Error listing buckets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the credit information for the account.
   * @returns The credit information.
   */
  public async getCreditInfo(): Promise<CreditAccount> {
    try {
      const info = await this.client.creditManager().getAccount();
      return info.result;
    } catch (error: any) {
      logger.error(`Error getting credit info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buys credit for the account.
   * @param amount The amount of credit to buy.
   * @returns The result of the buy operation.
   */
  public async buyCredit(amount: string): Promise<Result> {
    try {
      const info = await this.client.creditManager().buy(parseEther(amount));
      return info;
    } catch (error: any) {
      logger.error(`Error buying credit: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a bucket in Recall.
   * @param bucketAlias The alias of the bucket to create.
   * @returns The result of the create operation.
   */
  public async createBucket(bucketAlias: string): Promise<Result<{bucket: Address}>> {
    try {
      const query = await this.client.bucketManager().create({
        metadata: { alias: bucketAlias },
      });
      return query;
    } catch (error: any) {
      logger.error(`Error creating bucket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets or creates a log bucket in Recall.
   * @param bucketAlias The alias of the bucket to retrieve or create.
   * @returns The address of the log bucket.
   */
  public async getOrCreateBucket(bucketAlias: string): Promise<Address> {
    try {
      // Try to find the bucket by alias
      const buckets = await this.client.bucketManager().list();
      if (buckets?.result) {
        const bucket = buckets.result.find((b) => b.metadata?.alias === bucketAlias);
        if (bucket) {
          return bucket.addr; // Return existing bucket address
        } 
      }

      // Create new bucket if not found
      const query = await this.client.bucketManager().create({
        metadata: { alias: bucketAlias },
      });

      const newBucket = query.result;
      if (!newBucket) {
        logger.error(`Failed to create new bucket with alias: ${bucketAlias}`);
        throw new Error(`Failed to create bucket: ${bucketAlias}`);
      }

      return newBucket.bucket;
    } catch (error: any) {
      logger.error(`Error in getOrCreateBucket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Adds an object to a bucket.
   * @param bucket The address of the bucket.
   * @param key The key under which to store the object.
   * @param data The data to store (as a string, File, or Uint8Array).
   * @param options Optional parameters.
   * @returns The result of the add operation.
   */
  public async addObject(
    bucket: Address,
    key: string,
    data: string | File | Uint8Array,
    options?: { overwrite?: boolean },
  ): Promise<Result> {
    try {
      // If data is a string, convert it to a Uint8Array
      const dataToStore = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;
        
      const info = await this.client
        .bucketManager()
        .add(bucket, key, dataToStore, {
          overwrite: options?.overwrite ?? false,
        });
      return info;
    } catch (error: any) {
      logger.error(`Error adding object: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets an object from a bucket.
   * @param bucket The address of the bucket.
   * @param key The key under which the object is stored.
   * @returns The data stored under the specified key as a Uint8Array.
   */
  public async getObject(bucket: Address, key: string): Promise<Uint8Array | undefined> {
    try {
      const info = await this.client.bucketManager().get(bucket, key);
      return info.result;
    } catch (error: any) {
      logger.error(`Error getting object: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Gets an object from a bucket and decodes it as a string.
   * @param bucket The address of the bucket.
   * @param key The key under which the object is stored.
   * @returns The data stored under the specified key as a string.
   */
  public async getObjectAsString(bucket: Address, key: string): Promise<string | undefined> {
    try {
      const data = await this.getObject(bucket, key);
      if (data) {
        return new TextDecoder().decode(data);
      }
      return undefined;
    } catch (error: any) {
      logger.error(`Error getting object as string: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Lists all objects in a bucket.
   * @param bucket The address of the bucket.
   * @returns An array of objects containing key and metadata.
   */
  public async listBucketObjects(bucket: Address): Promise<{key: string, metadata?: any}[]> {
    try {
      const queryResult = await this.client.bucketManager().query(bucket);
      if (!queryResult.result?.objects.length) {
        return [];
      }
      
      return queryResult.result.objects.map(obj => ({
        key: obj.key,
        metadata: obj.state?.metadata || undefined
      }));
    } catch (error: any) {
      logger.error(`Error listing bucket objects: ${error.message}`);
      throw error;
    }
  }
} 