export const getAccountInfoPrompt = `
This tool will get account information from Recall, including token $RECALL balances, address, and nonce.

It takes one argument:
- address (str, optional): The address of the account, else, defaults to the connected user's account address.
`;
