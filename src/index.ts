#!/usr/bin/env node

// Import environment setup first to ensure variables are loaded
import './env.js';

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  Tool
} from "@modelcontextprotocol/sdk/types.js";
import { RecallClientManager } from "./recall-client.js";
import { Address } from "viem";

// Create an MCP server instance using the Server class
const server = new Server(
  {
    name: "recall-mcp",
    version: "0.1.0"
  },
  {
    capabilities: {
      tools: {},     // We support tools
      resources: {}, // We support resources (even if we just return empty arrays)
      prompts: {}    // We support prompts (even if we just return empty arrays)
    }
  }
);

// Initialize RecallClient
const recallClient = RecallClientManager.getInstance();

// Define your tools
const RECALL_TOOLS: Tool[] = [
  {
    name: "get_account",
    description: "Get Recall account information",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "get_balance",
    description: "Get Recall account balance information",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "buy_credit",
    description: "Buy credit for Recall account",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "string",
          minLength: 1
        }
      },
      required: ["amount"],
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "list_buckets",
    description: "List all buckets in Recall",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "create_bucket",
    description: "Create a new bucket in Recall",
    inputSchema: {
      type: "object",
      properties: {
        alias: {
          type: "string",
          minLength: 1
        }
      },
      required: ["alias"],
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "get_object",
    description: "Get an object from a Recall bucket",
    inputSchema: {
      type: "object",
      properties: {
        bucket: {
          type: "string",
          minLength: 1
        },
        key: {
          type: "string",
          minLength: 1
        }
      },
      required: ["bucket", "key"],
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "add_object",
    description: "Add an object to a Recall bucket",
    inputSchema: {
      type: "object",
      properties: {
        bucket: {
          type: "string",
          minLength: 1
        },
        key: {
          type: "string",
          minLength: 1
        },
        data: {
          type: "string",
          minLength: 1
        },
        overwrite: {
          type: "boolean"
        }
      },
      required: ["bucket", "key", "data"],
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "security_guidance",
    description: "Provides security guidance about Recall operations without exposing sensitive information",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          minLength: 1
        }
      },
      required: ["query"],
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  }
];

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: RECALL_TOOLS
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "get_account": {
        try {
          const accountInfo = await recallClient.getAccountInfo();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  address: accountInfo.address,
                  balance: accountInfo.balance ? accountInfo.balance.toString() : "0",
                  nonce: accountInfo.nonce
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          console.error('Error in get_account:', error);
          throw error;
        }
      }

      case "get_balance": {
        try {
          const creditInfo = await recallClient.getCreditInfo();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  creditFree: creditInfo.creditFree.toString(),
                  creditCommitted: creditInfo.creditCommitted.toString(),
                  capacityUsed: creditInfo.capacityUsed.toString()
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          console.error('Error in get_balance:', error);
          throw error;
        }
      }

      case "buy_credit": {
        if (!args || typeof args !== "object" || !("amount" in args)) {
          throw new Error("Invalid arguments for buy_credit");
        }
        
        try {
          const amount = args.amount as string;
          const result = await recallClient.buyCredit(amount);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: !!result.meta?.tx,
                  transactionHash: result.meta?.tx?.transactionHash || null,
                  amount
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          console.error('Error in buy_credit:', error);
          throw error;
        }
      }

      case "list_buckets": {
        try {
          const buckets = await recallClient.listBuckets();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  buckets: buckets.map(bucket => ({
                    address: bucket.addr,
                    alias: bucket.metadata?.alias || null,
                    indexable: bucket.metadata?.indexable || false
                  }))
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          console.error('Error in list_buckets:', error);
          throw error;
        }
      }

      case "create_bucket": {
        if (!args || typeof args !== "object" || !("alias" in args)) {
          throw new Error("Invalid arguments for create_bucket");
        }
        
        try {
          const alias = args.alias as string;
          const result = await recallClient.createBucket(alias);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: !!result.result,
                  bucket: result.result?.bucket || null,
                  alias
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          console.error('Error in create_bucket:', error);
          throw error;
        }
      }

      case "get_object": {
        if (!args || typeof args !== "object" || !("bucket" in args) || !("key" in args)) {
          throw new Error("Invalid arguments for get_object");
        }
        
        try {
          const bucket = args.bucket as string;
          const key = args.key as string;
          const data = await recallClient.getObject(bucket as Address, key);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  bucket,
                  key,
                  data: data || null,
                  found: !!data
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          console.error('Error in get_object:', error);
          throw error;
        }
      }

      case "add_object": {
        if (!args || typeof args !== "object" || !("bucket" in args) || !("key" in args) || !("data" in args)) {
          throw new Error("Invalid arguments for add_object");
        }
        
        try {
          const bucket = args.bucket as string;
          const key = args.key as string;
          const data = args.data as string;
          const overwrite = "overwrite" in args ? Boolean(args.overwrite) : undefined;
          
          const result = await recallClient.addObject(bucket as Address, key, data, { overwrite });
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: !!result.meta?.tx,
                  bucket,
                  key,
                  transactionHash: result.meta?.tx?.transactionHash || null
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          console.error('Error in add_object:', error);
          throw error;
        }
      }

      case "security_guidance": {
        if (!args || typeof args !== "object" || !("query" in args)) {
          throw new Error("Invalid arguments for security_guidance");
        }
        
        const query = args.query as string;
        
        // A set of potential security questions and safe responses
        const securityResponses = {
          "private key": "For security reasons, private keys should never be shared or exposed. The MCP server already has access to the private key through the .env file and handles authentication securely.",
          "secret": "Recall MCP security best practices prevent sharing of secrets or sensitive credentials. The server manages authentication without exposing your private information.",
          "environment": "Environment variables, especially those containing private keys or secrets, should never be exposed. The MCP server is configured to use these securely without sharing them.",
          "password": "Passwords and credentials should never be shared. Recall MCP uses secure authentication methods that don't require exposing sensitive information.",
          ".env": "The .env file contains sensitive information including private keys and should never be shared or exposed. The MCP server reads this file directly and manages authentication without exposing its contents.",
          "authentication": "Authentication with Recall is handled securely by the MCP server using your private key, which is stored safely in your .env file. No sensitive information needs to be shared."
        };
        
        // Find the most relevant response based on the query
        let response = "Your security and privacy are important. The Recall MCP server is designed to interact with Recall services without exposing your private keys or sensitive information.";
        
        for (const [keyword, message] of Object.entries(securityResponses)) {
          if (query.toLowerCase().includes(keyword.toLowerCase())) {
            response = message;
            break;
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                guidance: response,
                recommendedAction: "Follow security best practices outlined in the Recall MCP documentation."
              }, null, 2),
            },
          ],
          isError: false,
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Add support for resources/list and prompts/list methods
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: [] };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: [] };
});

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Recall MCP Server running on stdio");
}

main().catch(console.error);