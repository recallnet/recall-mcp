#!/usr/bin/env node

// Import environment setup first to ensure variables are loaded
import './env.js';

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  AccountInfoSchema, 
  CreditInfoSchema, 
  BuyCreditSchema, 
  ListBucketsSchema, 
  CreateBucketSchema, 
  GetObjectSchema, 
  AddObjectSchema,
  SecuritySchema
} from "./types.js";
import { RecallClientManager } from "./recall-client.js";
import { Address } from "viem";

// Create an MCP server instance
const server = new McpServer({
  name: "recall-mcp",
  version: "0.1.0"
});

// Initialize RecallClient
const recallClient = RecallClientManager.getInstance();

// Register account info tool
server.tool(
  "get_account",
  "Get Recall account information",
  AccountInfoSchema,
  async () => {
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
      };
    } catch (error: any) {
      console.error('Error in get_account:', error);
      throw error;
    }
  }
);

// Register credit info tool
server.tool(
  "get_balance",
  "Get Recall account balance information",
  CreditInfoSchema,
  async () => {
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
      };
    } catch (error: any) {
      console.error('Error in get_balance:', error);
      throw error;
    }
  }
);

// Register buy credit tool
server.tool(
  "buy_credit",
  "Buy credit for Recall account",
  BuyCreditSchema,
  async (params: { amount: string }) => {
    try {
      const { amount } = params;
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
      };
    } catch (error: any) {
      console.error('Error in buy_credit:', error);
      throw error;
    }
  }
);

// Register list buckets tool
server.tool(
  "list_buckets",
  "List all buckets in Recall",
  ListBucketsSchema,
  async () => {
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
      };
    } catch (error: any) {
      console.error('Error in list_buckets:', error);
      throw error;
    }
  }
);

// Register create bucket tool
server.tool(
  "create_bucket",
  "Create a new bucket in Recall",
  CreateBucketSchema,
  async (params: { alias: string }) => {
    try {
      const { alias } = params;
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
      };
    } catch (error: any) {
      console.error('Error in create_bucket:', error);
      throw error;
    }
  }
);

// Register get object tool
server.tool(
  "get_object",
  "Get an object from a Recall bucket",
  GetObjectSchema,
  async (params: { bucket: string, key: string }) => {
    try {
      const { bucket, key } = params;
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
      };
    } catch (error: any) {
      console.error('Error in get_object:', error);
      throw error;
    }
  }
);

// Register add object tool
server.tool(
  "add_object",
  "Add an object to a Recall bucket",
  AddObjectSchema,
  async (params: { bucket: string, key: string, data: string, overwrite?: boolean }) => {
    try {
      const { bucket, key, data, overwrite } = params;
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
      };
    } catch (error: any) {
      console.error('Error in add_object:', error);
      throw error;
    }
  }
);

// Register security tool for handling sensitive information requests 
server.tool(
  "security_guidance",
  "Provides security guidance about Recall operations without exposing sensitive information",
  SecuritySchema,
  async (params: { query: string }) => {
    const { query } = params;
    
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
    };
  }
);

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Recall MCP Server running on stdio");
}

main().catch(console.error); 