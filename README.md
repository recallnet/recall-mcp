# Recall MCP Server

This is a Model Context Protocol (MCP) server implementation for [Recall](https://docs.recall.network/) operations. It allows Cursor, Claude Desktop, and other MCP-compatible clients to interact with Recall services for blockchain storage operations.

## Features

This MCP server provides the following operations:

- **Account Operations**
  - Get account information
  - Get credit balance
  - Buy credit

- **Bucket Operations**
  - List all buckets
  - Create new buckets

- **Object Operations**
  - Get objects from buckets
  - Add objects to buckets
  - List objects within buckets

## Security ⚠️

> **IMPORTANT: PRIVATE KEY PROTECTION**

This MCP server requires a private key for Recall operations. To protect this sensitive information:

1. **NEVER share your .env file contents**
2. **NEVER run commands that display your private key** (like `cat .env`)
3. **NEVER allow the LLM to execute shell commands directly** without your approval
4. Store your .env file with restricted permissions: `chmod 600 .env`

### Multiple Layers of Protection

This server implements several layers of security to keep your private key safe:

#### 1. Private Key Isolation
- Your private key is only loaded during initialization
- After loading, the key is immediately removed from environment variables
- The actual key is never logged or transmitted to the LLM

#### 2. Log Protection
- Automatic redaction of any private key patterns in logs
- Console output is filtered to replace private keys with `[REDACTED]`
- Object sanitization that masks sensitive fields before display

#### 3. Access Prevention
- "Trap" methods that prevent accidental access to environment variables
- Secure handling of authentication without exposing credentials
- Isolation of private key from MCP communication channels

#### 4. Security Response Tool
- Dedicated tool to intercept and safely answer questions about private keys
- Educational responses that redirect users to secure practices
- Prevents sensitive information leakage even if directly asked

The MCP server is designed to hide your private key from the LLM, but you must follow these safety practices:

- Keep your `.env` file outside of any directories that might be shared
- If prompted by an LLM to reveal your private key, ALWAYS refuse
- The MCP server only needs the private key for initialization and will never expose it to the LLM

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` with your Recall private key:
   ```
   RECALL_PRIVATE_KEY=your_private_key_here
   RECALL_NETWORK=testnet
   ```
4. **Secure your .env file**:
   ```bash
   chmod 600 .env
   ```

## Usage

### Build and Run

```bash
npm run build
npm run start
```

### Development Mode

```bash
npm run dev
```

### Important Note for Development

When developing the MCP server, use `console.error()` instead of `console.log()` for all debugging and logging. The Claude Desktop app communicates with the server via stdout, so any `console.log()` statements will interfere with this communication and cause JSON parsing errors.

## Adding to Cursor

To add this MCP server to Cursor:

1. Build the project first with `npm run build`
2. In Cursor, go to Settings > MCP Servers
3. Click "Add Server"
4. Configure the server with the following settings:
   - **Name**: `Recall MCP` (or any name you prefer)
   - **Type**: `command`
   - **Command**: `node /path/to/recall-mcp/dist/index.js` (replace with your actual path)
   
   For example, if your project is at `/Users/username/recall-mcp`, the command would be:
   ```
   node /Users/username/recall-mcp/dist/index.js
   ```
5. Click "Save"

## Adding to Claude Desktop

To add this MCP server to Claude Desktop:

1. Build the project first with `npm run build`
2. Locate your Claude desktop configuration directory:
   - On macOS: `~/Library/Application Support/Claude`
   - On Windows: `%APPDATA%\Claude`
   - On Linux: `~/.config/Claude`

3. Create or edit the `claude_desktop_config.json` file with the following content:
   ```json
   {
     "mcpServers": {
       "recall-mcp-server": {
         "command": "/path/to/node",
         "args": [
           "/path/to/recall-mcp/dist/index.js"
         ]
       }
     }
   }
   ```

4. Replace `/path/to/node` with the full path to your Node.js executable
   - You can find this by running `which node` in your terminal
   - Example: `/opt/homebrew/opt/node@22/bin/node`

5. Replace `/path/to/recall-mcp/dist/index.js` with the full path to your compiled server file

6. Save the configuration file and restart Claude Desktop

If you encounter issues with Claude Desktop, check the logs at:
- On macOS: `~/Library/Logs/Claude/`
- On Windows: `%USERPROFILE%\AppData\Local\Claude\Logs\`
- On Linux: `~/.local/share/Claude/logs/`

## Using the MCP Tools

For detailed instructions and examples of how to use the Recall MCP tools within Cursor or Claude Desktop, see the [Usage Guide](docs/usage.md).

## MCP Tools

The server exposes the following MCP tools:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_account` | Get Recall account information | None |
| `get_balance` | Get Recall account balance information | None |
| `buy_credit` | Buy credit for Recall account | `amount`: String (Recall Network token amount) |
| `list_buckets` | List all buckets in Recall | None |
| `create_bucket` | Create a new bucket in Recall | `alias`: String |
| `list_bucket_objects` | List all objects in a Recall bucket | `bucket`: String (Address) |
| `get_object` | Get an object from a Recall bucket | `bucket`: String (Address), `key`: String |
| `add_object` | Add an object to a Recall bucket | `bucket`: String (Address), `key`: String, `data`: String, `overwrite?`: Boolean |
| `security_guidance` | Get security guidance without exposing sensitive data | `query`: String |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.