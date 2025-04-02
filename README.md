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

1. **NEVER share your private key or .env file contents**
2. **NEVER run commands that display your private key** (like `cat .env`)
3. **NEVER allow the LLM to execute shell commands directly** without your approval
4. If using a .env file, store it with restricted permissions: `chmod 600 .env`

### Multiple Layers of Protection

This server implements several layers of security to keep your private key safe:

#### 1. Private Key Isolation
- Your private key is only loaded during initialization
- After loading, the key is immediately removed from environment variables
- The actual key is never logged or transmitted to the LLM

#### 2. Log Protection
- Automatic redaction of any private key patterns in logs
- Custom logger
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

- Keep your private key secure and never share it
- If prompted by an LLM to reveal your private key, ALWAYS refuse
- The MCP server only needs the private key for initialization and will never expose it to the LLM

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Choose one of these configuration methods:

   ### Method 1: Using environment variables in Cursor/Claude config (Recommended)
   The recommended approach is to provide environment variables directly in your Cursor or Claude Desktop configuration. This is more secure and eliminates the need for a .env file.
   
   - The server will automatically use these environment variables when provided through the configuration.
   - See the "Adding to Cursor" and "Adding to Claude Desktop" sections below for specific setup instructions.

   ### Method 2: Using a .env file (Fallback)
   If you prefer to use a .env file, or are running the server directly without Cursor/Claude, you can create one:
   
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
   
   The server will only attempt to load from the .env file if the required environment variables (RECALL_PRIVATE_KEY) are not already present in the environment.

## Environment Variable Precedence

The Recall MCP server uses the following order of precedence for environment variables:

1. Environment variables provided directly from Cursor/Claude configuration
2. Environment variables from a .env file (if present and #1 is not available)
3. Default values for optional variables (e.g., RECALL_NETWORK defaults to "testnet")

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
   - **Command**: `node`
   - **Arguments**: `/path/to/recall-mcp/dist/index.js` (replace with your actual path)
   - **Environment Variables**:
     - `RECALL_PRIVATE_KEY`: Your private key (with or without "0x" prefix)
     - `RECALL_NETWORK`: `testnet` (or `mainnet` if needed)
     - `DEBUG`: `true` (optional, for additional logging)
5. Click "Save"

### Using Environment Variables in Cursor Configuration

For more security, you can configure Cursor via the `.cursor/mcp.json` file in your home directory:

```json
{
  "mcpServers": {
    "recall-mcp": {
      "name": "Recall MCP",
      "type": "command",
      "command": "node",
      "args": ["/path/to/recall-mcp/dist/index.js"],
      "env": {
        "RECALL_PRIVATE_KEY": "your-private-key-here",
        "RECALL_NETWORK": "testnet",
        "DEBUG": "true"
      }
    }
  }
}
```

This approach eliminates the need for a .env file.

## Adding to Claude Desktop

To add this MCP server to Claude Desktop:

1. Build the project first with `npm run build`
2. Locate your Claude Desktop configuration file at:
   - On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - On Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - On Linux: `~/.config/Claude/claude_desktop_config.json`

3. Create or edit the `claude_desktop_config.json` file with the following content:
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

4. Replace `/path/to/recall-mcp/dist/index.js` with the full path to your compiled server file
   - Example: `/Users/username/recall-mcp/dist/index.js`

5. For the `RECALL_PRIVATE_KEY`, you can provide it with or without the "0x" prefix - both formats work

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