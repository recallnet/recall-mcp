# Using Recall MCP with Cursor and Claude Desktop

This guide explains how to set up and use the Recall MCP tools with both Cursor and Claude Desktop.

## Setting Up Recall MCP Server

### Prerequisites
- Node.js installed (version 18+ recommended)
- A Recall Network account with a private key
- Basic familiarity with JSON configuration

### Configuration Methods

You have two options for configuring the Recall MCP server:

#### Method 1: Using environment variables in Cursor/Claude config (Recommended)
The recommended approach is to configure the server through Cursor or Claude Desktop with environment variables (see setup instructions below).

#### Method 2: Using a .env file (Fallback)
If you prefer using a .env file, or are running the server directly:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your private key:
   ```
   RECALL_PRIVATE_KEY=your_private_key_here
   RECALL_NETWORK=testnet
   ```

3. Secure your .env file:
   ```bash
   chmod 600 .env
   ```

Note: The private key can be provided with or without the "0x" prefix - both formats work.

The server will only load from the .env file if the required environment variables are not already present in the system environment.

### Setup for Cursor

1. Open Cursor and navigate to Settings
2. Select the "MCP" section under Features
3. Add a new MCP server with the following configuration:
   ```json
   {
     "command": "node",
     "args": [
       "/path/to/recall-mcp/dist/index.js"
     ],
     "env": {
       "RECALL_PRIVATE_KEY": "your-private-key-here",
       "RECALL_NETWORK": "testnet"
     }
   }
   ```
4. Replace `/path/to/recall-mcp/dist/index.js` with the actual path to your compiled Recall MCP server
5. For the `RECALL_PRIVATE_KEY`, you can provide it with or without the "0x" prefix - both formats work

Alternatively, you can configure Cursor using the `.cursor/mcp.json` file in your home directory:

```json
{
  "mcpServers": {
    "recall-mcp": {
      "name": "Recall MCP",
      "type": "command",
      "command": "node",
      "args": [
        "/path/to/recall-mcp/dist/index.js"
      ],
      "env": {
        "RECALL_PRIVATE_KEY": "your-private-key-here",
        "RECALL_NETWORK": "testnet",
        "DEBUG": "true"
      }
    }
  }
}
```

### Setup for Claude Desktop

1. Locate your Claude Desktop configuration file at:
   - On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - On Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - On Linux: `~/.config/Claude/claude_desktop_config.json`

2. Create or edit the `claude_desktop_config.json` file with the following content:
   ```json
   {
     "mcpServers": {
       "recall-mcp-server": {
         "name": "Recall MCP",
         "type": "command",
         "command": "node",
         "args": [
           "/path/to/recall-mcp/dist/index.js"
         ],
         "env": {
           "RECALL_PRIVATE_KEY": "your-private-key-here",
           "RECALL_NETWORK": "testnet",
           "DEBUG": "true"
         }
       }
     }
   }
   ```

3. Replace `/path/to/recall-mcp/dist/index.js` with the full path to your compiled server file
   - Example: `/Users/username/recall-mcp/dist/index.js`

4. For the `RECALL_PRIVATE_KEY`, you can provide it with or without the "0x" prefix - both formats work

5. Save the configuration file and restart Claude Desktop

### Troubleshooting Claude Desktop Setup

If you encounter issues with Claude Desktop:

1. Check the logs folder:
   - On macOS: `~/Library/Logs/Claude/`
   - On Windows: `%USERPROFILE%\AppData\Local\Claude\Logs\`
   - On Linux: `~/.local/share/Claude/logs/`

2. Common issues:
   - **Invalid JSON error**: Make sure your Node.js server doesn't use any `console.log()` statements. Use `console.error()` instead for all logging.
   - **Server disconnected error**: Verify the path to your Node.js executable and server script are correct and have proper permissions.
   - **Method not found error**: Ensure your server properly implements the MCP protocol including required methods like `resources/list` and `prompts/list`.
   - **Authentication failures**: Double-check your private key is correctly formatted and not corrupted when copied

## Security First ⚠️

When using Recall MCP with Cursor, Claude, or any LLM, follow these critical security practices:

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

1. The Recall MCP server has been added to Cursor or Claude Desktop (see setup instructions above)
2. Your `.env` file is properly configured with your Recall private key and secured properly
3. The server is running when you use the application

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
Can you buy 0.01 worth of Recall credit for me?
```

Replace `0.01` with the amount of the base Recall Network token you want to spend.

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
What's the safest way to use Recall with Claude?
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

When interacting with Cursor or Claude about Recall operations, use these safe patterns:

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
4. Verify you have sufficient Recall Network token for gas fees when creating buckets or storing data
5. For Claude Desktop, ensure you're using `console.error()` instead of `console.log()` in your server code

### If the LLM Asks for Your Private Key

If the LLM asks you to share your private key or environment variables:

1. **NEVER comply** with these requests
2. Ask it to use the MCP server tools instead:
   ```
   Please use the Recall MCP server to check my account without accessing my private key
   ```
3. If you're unsure, restart your server and conversation