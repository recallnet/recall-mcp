import { logger } from './env.js';
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
import { ToolManager } from "./tool-manager.js";
import { z } from "zod"; 

// Configuration for the dynamic tools bucket
const TOOLS_BUCKET_ALIAS = "mcp-dynamic-tools";
let toolsBucketAddress: Address | null = null;
let toolManager: ToolManager | null = null;

// Keep track of dynamically loaded tools
const dynamicTools: Map<string, {
  tool: Tool,
  implementation: Function
}> = new Map();

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
    name: "list_bucket_objects",
    description: "List all objects in a Recall bucket",
    inputSchema: {
      type: "object",
      properties: {
        bucket: {
          type: "string",
          minLength: 1
        }
      },
      required: ["bucket"],
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
  },
  // New tools for managing functions in Recall
  {
    name: "store_tool_function",
    description: "Store a function with its parameters in Recall for dynamic execution",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the tool function",
          minLength: 1
        },
        description: {
          type: "string",
          description: "Description of what the tool does"
        },
        functionBody: {
          type: "string",
          description: "JavaScript function body as a string",
          minLength: 1
        },
        parameters: {
          type: "object",
          description: "Parameter definitions with types and descriptions",
          additionalProperties: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["string", "number", "boolean", "object", "array"]
              },
              description: {
                type: "string"
              },
              required: {
                type: "boolean",
                default: true
              }
            },
            required: ["type"]
          }
        }
      },
      required: ["name", "functionBody", "parameters"],
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "store_tool_template",
    description: "Store a templated tool in Recall for dynamic execution",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the tool function",
          minLength: 1
        },
        description: {
          type: "string",
          description: "Description of what the tool does"
        },
        templateType: {
          type: "string",
          description: "Type of template (api_call, transformation)",
          enum: ["api_call", "transformation"]
        },
        config: {
          type: "object",
          description: "Configuration for the template"
        },
        parameters: {
          type: "object",
          description: "Parameter definitions with types and descriptions",
          additionalProperties: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["string", "number", "boolean", "object", "array"]
              },
              description: {
                type: "string"
              },
              required: {
                type: "boolean",
                default: true
              }
            },
            required: ["type"]
          }
        }
      },
      required: ["name", "templateType", "config", "parameters"],
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  },
  {
    name: "list_dynamic_tools",
    description: "List all dynamically stored tools in Recall",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
      $schema: "http://json-schema.org/draft-07/schema#"
    }
  }
];

// Initialize the tool manager and load dynamic tools
async function initializeToolManager() {
  try {
    // Get or create a bucket for storing tool functions
    toolsBucketAddress = await recallClient.getOrCreateBucket(TOOLS_BUCKET_ALIAS);
    
    if (!toolsBucketAddress) {
      logger.error("Failed to initialize tools bucket");
      return;
    }
    
    // Initialize the tool manager
    toolManager = new ToolManager(toolsBucketAddress);
    
    // Load all stored tools
    await loadDynamicTools();
    
    logger.info(`Tool manager initialized with bucket: ${toolsBucketAddress}`);
  } catch (error: any) {
    logger.error(`Error initializing tool manager: ${error.message}`);
    if (error.cause) {
      logger.error(`Cause: ${error.cause}`);
    }
  }
}

// Load all dynamic tools from Recall
async function loadDynamicTools() {
  if (!toolManager) {
    logger.error("Tool manager not initialized");
    return;
  }
  
  try {
    const toolNames = await toolManager.listTools();
    logger.info(`Found ${toolNames.length} dynamic tools`);
    
    // Clear existing dynamic tools map before reloading
    dynamicTools.clear();
    
    for (const toolName of toolNames) {
      try {
        // Load the tool
        const loadedTool = await toolManager.loadTool(toolName);
        
        // Convert Zod schema to JSON Schema for MCP
        const schemaProperties: Record<string, any> = {};
        const requiredParams: string[] = [];
        
        for (const [key, validator] of Object.entries(loadedTool.schema)) {
          // Determine the type from Zod validator
          let type = "string"; // Default
          
          if (validator instanceof z.ZodString) {
            type = "string";
          } else if (validator instanceof z.ZodNumber) {
            type = "number";
          } else if (validator instanceof z.ZodBoolean) {
            type = "boolean";
          } else if (validator instanceof z.ZodArray) {
            type = "array";
          } else if (validator instanceof z.ZodObject) {
            type = "object";
          }
          
          // Get description if available
          const description = validator.description || undefined;
          
          // Add to schema properties
          schemaProperties[key] = {
            type,
            ...(description ? { description } : {})
          };
          
          // Check if required
          if (!validator.isOptional()) {
            requiredParams.push(key);
          }
        }
        
        // Create MCP tool definition
        const toolDefinition: Tool = {
          name: loadedTool.name,
          description: `Dynamic tool: ${loadedTool.name}`,
          inputSchema: {
            type: "object",
            properties: schemaProperties,
            ...(requiredParams.length > 0 ? { required: requiredParams } : {}),
            additionalProperties: false,
            $schema: "http://json-schema.org/draft-07/schema#"
          }
        };
        
        // Add to dynamic tools map
        dynamicTools.set(toolName, {
          tool: toolDefinition,
          implementation: loadedTool.implementation
        });
        
        logger.info(`Loaded dynamic tool: ${toolName}`);
      } catch (error: any) {
        logger.error(`Error loading tool ${toolName}: ${error.message}`);
        // Add more detailed error info if available
        if (error.cause) {
          logger.error(`Cause: ${error.cause}`);
        }
      }
    }
  } catch (error: any) {
    logger.error(`Error loading dynamic tools: ${error.message}`);
    if (error.cause) {
      logger.error(`Cause: ${error.cause}`);
    }
  }
}

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    ...RECALL_TOOLS,
    ...Array.from(dynamicTools.values()).map(entry => entry.tool)
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Check if it's a dynamic tool
    if (dynamicTools.has(name)) {
      try {
        const dynamicTool = dynamicTools.get(name);
        if (!dynamicTool) {
          throw new Error(`Dynamic tool ${name} not found`);
        }
        
        // Execute the dynamic tool
        const result = await dynamicTool.implementation(args || {});
        
        return {
          content: [
            {
              type: "text",
              text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
            },
          ],
          isError: false,
        };
      } catch (error: any) {
        logger.error(`Error executing dynamic tool ${name}:`, error);
        throw error;
      }
    }

    // Otherwise, handle built-in tools
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
          logger.error('Error in get_account:', error);
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
          logger.error('Error in get_balance:', error);
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
          logger.error('Error in buy_credit:', error);
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
          logger.error('Error in list_buckets:', error);
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
          logger.error('Error in create_bucket:', error);
          throw error;
        }
      }

      case "list_bucket_objects": {
        if (!args || typeof args !== "object" || !("bucket" in args)) {
          throw new Error("Invalid arguments for list_bucket_objects");
        }
        
        try {
          const bucket = args.bucket as string;
          const objects = await recallClient.listBucketObjects(bucket as Address);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  bucket,
                  objects: objects.map(obj => ({
                    key: obj.key,
                    metadata: obj.metadata || null
                  }))
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          logger.error('Error in list_bucket_objects:', error);
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
          const data = await recallClient.getObjectAsString(bucket as Address, key);
          
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
          logger.error('Error in get_object:', error);
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
          logger.error('Error in add_object:', error);
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

      // New handlers for dynamic tool management
      case "store_tool_function": {
        if (!toolManager) {
          throw new Error("Tool manager not initialized");
        }

        if (!args || typeof args !== "object" || !("name" in args) || !("functionBody" in args) || !("parameters" in args)) {
          throw new Error("Invalid arguments for store_tool_function");
        }
        
        try {
          const name = args.name as string;
          const functionBodyStr = args.functionBody as string;
          const parametersObj = args.parameters as Record<string, any>;
          const description = (args.description as string) || "";
          
          // Create a Function from the string (will be serialized later)
          let functionImplementation: Function;
          try {
            functionImplementation = new Function(`return ${functionBodyStr}`)();
          } catch (error) {
            throw new Error(`Invalid function body: ${error}`);
          }
          
          // Convert parameters to Zod schema
          const zodSchema: Record<string, z.ZodTypeAny> = {};
          
          for (const [key, paramInfo] of Object.entries(parametersObj)) {
            if (typeof paramInfo !== 'object' || !paramInfo) {
              throw new Error(`Invalid parameter definition for ${key}`);
            }
            
            const { type, description, required } = paramInfo as { type: string, description?: string, required?: boolean };
            
            let validator: z.ZodTypeAny;
            
            switch (type) {
              case "string":
                validator = z.string();
                break;
              case "number":
                validator = z.number();
                break;
              case "boolean":
                validator = z.boolean();
                break;
              case "array":
                validator = z.array(z.any());
                break;
              case "object":
                validator = z.object({});
                break;
              default:
                validator = z.any();
            }
            
            if (description) {
              validator = validator.describe(description);
            }
            
            if (required === false) {
              validator = validator.optional();
            }
            
            zodSchema[key] = validator;
          }
          
          // Store the tool
          await toolManager.storeTool(name, zodSchema, functionImplementation);
          
          // Reload all dynamic tools
          await loadDynamicTools();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `Tool function '${name}' stored successfully`,
                  toolName: name
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          logger.error('Error in store_tool_function:', error);
          throw error;
        }
      }

      case "store_tool_template": {
        if (!toolManager) {
          throw new Error("Tool manager not initialized");
        }

        if (!args || 
            typeof args !== "object" || 
            !("name" in args) || 
            !("templateType" in args) || 
            !("config" in args) || 
            !("parameters" in args)) {
          throw new Error("Invalid arguments for store_tool_template");
        }
        
        try {
          const name = args.name as string;
          const templateType = args.templateType as string;
          const config = args.config as Record<string, any>;
          const parametersObj = args.parameters as Record<string, any>;
          const description = (args.description as string) || "";
          
          // Convert parameters to Zod schema
          const zodSchema: Record<string, z.ZodTypeAny> = {};
          
          for (const [key, paramInfo] of Object.entries(parametersObj)) {
            if (typeof paramInfo !== 'object' || !paramInfo) {
              throw new Error(`Invalid parameter definition for ${key}`);
            }
            
            const { type, description, required } = paramInfo as { type: string, description?: string, required?: boolean };
            
            let validator: z.ZodTypeAny;
            
            switch (type) {
              case "string":
                validator = z.string();
                break;
              case "number":
                validator = z.number();
                break;
              case "boolean":
                validator = z.boolean();
                break;
              case "array":
                validator = z.array(z.any());
                break;
              case "object":
                validator = z.object({});
                break;
              default:
                validator = z.any();
            }
            
            if (description) {
              validator = validator.describe(description);
            }
            
            if (required === false) {
              validator = validator.optional();
            }
            
            zodSchema[key] = validator;
          }
          
          // Store the templated tool
          await toolManager.storeTemplatedTool(name, zodSchema, templateType, config);
          
          // Reload all dynamic tools
          await loadDynamicTools();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  message: `Templated tool '${name}' stored successfully`,
                  toolName: name
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          logger.error('Error in store_tool_template:', error);
          throw error;
        }
      }

      case "list_dynamic_tools": {
        if (!toolManager) {
          throw new Error("Tool manager not initialized");
        }
        
        try {
          const toolNames = await toolManager.listTools();
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  tools: Array.from(dynamicTools.keys()).map(name => {
                    const dynamicTool = dynamicTools.get(name);
                    return {
                      name,
                      description: dynamicTool?.tool.description || "Dynamic tool"
                    };
                  })
                }, null, 2),
              },
            ],
            isError: false,
          };
        } catch (error: any) {
          logger.error('Error in list_dynamic_tools:', error);
          throw error;
        }
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
  try {
    // Initialize the tool manager before starting the server
    await initializeToolManager();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.error("Recall MCP Server running on stdio");
  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`);
  }
}

main().catch(logger.error);