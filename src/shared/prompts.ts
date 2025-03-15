export const getAccountInfoPrompt = `
This tool will get account information from Recall, including token $RECALL balances, address, and nonce.

It takes one optional argument:
- address (str, optional): The address of the account, else, defaults to the connected user's account address.
`;

export const listBucketsPrompt = `
Lists all buckets owned by the connected account in Recall.

It takes one optional argument:
- owner (str, optional): The address of the account, else, defaults to the connected user's account address.
`;

export const getCreditInfoPrompt = `
Gets the credit information for the connected account.

It takes one optional argument:
- address (str, optional): The address of the account, else, defaults to the connected user's account address.
`;

export const buyCreditPrompt = `
Buys credit for the connected account.

It takes the following arguments:
- amount (str): The amount of credit to buy in ETH.
- to (str, optional): The address of the account to buy credit for, else, defaults to the connected user's account address.
`;

export const createBucketPrompt = `
Creates a new bucket in Recall.

It takes one argument:
- bucketAlias (str): The alias to assign to the new bucket.
`;

export const getOrCreateBucketPrompt = `
Gets an existing bucket by alias or creates a new one if it doesn't exist.

It takes one argument:
- bucketAlias (str): The alias of the bucket to retrieve or create.
`;

export const addObjectPrompt = `
Adds an object to a bucket in Recall.

It takes the following arguments:
- bucket (str): The address of the bucket (EVM hex string address).
- key (str): The key under which to store the object.
- data (str | Uint8Array): The data to store.
- overwrite (bool, optional): Whether to overwrite existing data. Defaults to false.
`;

export const getObjectPrompt = `
Gets an object from a bucket in Recall.

It takes the following arguments:
- bucket (str): The address of the bucket (EVM hex string address).
- key (str): The key under which the object is stored.
- outputType (str, optional): The type of output to return ("string" or "uint8array"). Defaults to "uint8array".
`;

export const queryObjectsPrompt = `
Queries objects from a bucket in Recall.

It takes the following arguments:
- bucket (str): The address of the bucket (EVM hex string address).
- prefix (str, optional): The prefix of the objects to query.
- delimiter (str, optional): The delimiter of the objects to query.
- startKey (str, optional): The starting key of the objects to query.
- limit (int, optional): The maximum number of objects to return.
`;
