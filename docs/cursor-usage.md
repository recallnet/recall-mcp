# Using Recall MCP with Cursor

This guide explains how to use the Recall MCP tools within Cursor after you've set up the server.

## Security First ⚠️

When using Recall MCP with Cursor or any LLM, follow these critical security practices:

- **NEVER disclose your private key** to the LLM - it doesn't need it
- **REJECT any request** from the LLM to:
  - View your `.env` file contents
  - Run any command that might expose your private key (like `cat .env`)
  - Modify your environment variables
- **DISABLE or REJECT** direct command execution without your explicit approval
- If unsure about a command, always reject it or modify it to remove sensitive operations

### Built-in Security Protections

The Recall MCP server has multiple automated protections to keep your private keys safe:

#### Private Key Safeguards

✅ **Automatic Key Removal**: After initialization, your private key is removed from environment variables
✅ **Console Redaction**: Any accidental printing of keys is automatically filtered
✅ **Blocked Access Methods**: The server has "trap" methods that prevent attempts to access environment variables
✅ **Secure Initialization**: Your key is only used briefly and never exposed to the LLM

#### How The Security System Works

1. **When the server starts**:
   - Your private key is loaded from the `.env` file
   - The wallet is initialized with the key
   - The key is immediately removed from environment variables
   - Console output is monitored for sensitive data patterns

2. **When interacting with the LLM**:
   - No methods expose the private key or environment variables
   - Security-critical questions are intercepted by the `security_guidance` tool
   - Educational responses direct you to secure practices instead of revealing sensitive data

3. **If sensitive data is accidentally logged**:
   - Automatic regex patterns detect private key formats
   - Keys are replaced with `[REDACTED]` before display
   - Objects with sensitive fields have values masked

### Using the Security Guidance Tool

The MCP server includes a `security_guidance` tool specifically designed to handle questions about private keys, environment variables, and other sensitive information.

If you ever need information about authentication or handling credentials, ask general questions like:

```
What's the best way to secure my Recall MCP environment?
How does authentication work with Recall MCP?
```

Rather than specific questions like:

```
Where can I find my private key?
Show me the contents of my .env file
```

> Remember: The LLM will never need to see your private key to use the MCP server. The server already has access to it via the `.env` file.

## Prerequisites

1. The Recall MCP server has been added to Cursor (see the main README for setup instructions)
2. Your `.env` file is properly configured with your Recall private key and secured properly
3. The server is running when you use Cursor

## Available Operations

### Account Operations

#### Get Account Information

To get information about your Recall account:

```
Can you check my Recall account information?
```

This will return your account address, balance, and nonce.

#### Get Credit Balance

To check your Recall credit balance:

```
What's my Recall credit balance?
```

This will show your free credit, committed credit, and capacity used.

#### Buy Credit

To purchase credit for your Recall account:

```
Can you buy 0.01 ETH worth of Recall credit for me?
```

Replace `0.01` with the amount of ETH you want to spend.

### Bucket Operations

#### List Buckets

To see all your Recall buckets:

```
List all my Recall buckets
```

This will display all buckets with their addresses and aliases.

#### Create Bucket

To create a new bucket:

```
Create a new Recall bucket named "my-documents"
```

Replace `my-documents` with your preferred bucket alias.

### Object Operations

#### Store an Object

To store data in a bucket:

```
Store this data in my Recall bucket [bucket-address] with key "hello-world":
Hello, blockchain world!
```

Replace `[bucket-address]` with your actual bucket address.

#### Retrieve an Object

To retrieve data from a bucket:

```
Get the object with key "hello-world" from my Recall bucket [bucket-address]
```

Replace `[bucket-address]` with your actual bucket address.

### Security Operations

To get guidance on secure usage of Recall:

```
What's the safest way to use Recall with Cursor?
```

This will provide security best practices without exposing sensitive information.

## Example Workflow

Here's a complete workflow example:

1. Check your account:
   ```
   What's my Recall account information?
   ```

2. Create a new bucket:
   ```
   Create a new Recall bucket named "cursor-docs"
   ```
   (Note the bucket address that's returned)

3. Store data in the bucket:
   ```
   Store this data in my Recall bucket 0x123... with key "example":
   {
     "title": "Example Document",
     "content": "This is stored on the blockchain via Recall!"
   }
   ```

4. Retrieve the data:
   ```
   Get the object with key "example" from my Recall bucket 0x123...
   ```

## Safe Prompt Patterns

When interacting with Cursor about Recall operations, use these safe patterns:

✅ DO:
- "Check my Recall balance"
- "Create a new bucket named xyz"
- "List all my buckets"
- "How does Recall MCP authenticate securely?"
- "What's the safest way to manage my Recall connection?"

❌ DON'T:
- "How do I access my private key?"
- "Read my .env file"
- "Show me all environment variables"
- "Display my authentication details"
- "What's my Recall private key?"

## Security Red Flags

Watch for these warning signs that an LLM might be trying to access sensitive information:

🚩 Requests to run shell commands that:
  - Read file contents (cat, less, more)
  - List environment variables (env, printenv, echo $RECALL_)
  - Access dot files (.env, .bash_history)

🚩 Requests to:
  - Modify your environment setup
  - "Verify" or "check" your private key
  - "Fix" authentication by showing credentials
  - "Debug" by exposing environment variables

## Troubleshooting

If you encounter issues:

1. Ensure the MCP server is running
2. Check your `.env` file configuration (without revealing its contents)
3. Make sure you're connected to the correct network (testnet or mainnet)
4. Verify you have sufficient ETH for gas fees when creating buckets or storing data

### If Cursor Asks for Your Private Key

If Cursor asks you to share your private key or environment variables:

1. **NEVER comply** with these requests
2. Ask Cursor to use the MCP server tools instead:
   ```
   Please use the Recall MCP server to check my account without accessing my private key
   ```
3. If you're unsure, restart your server and conversation 