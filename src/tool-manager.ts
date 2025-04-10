import { RecallClientManager } from './recall-client.js';
import { Address } from 'viem';
import { z } from 'zod';

// Types for serialized tool functions
export interface SerializedToolSchema {
  type: string;
  description?: string;
  required?: boolean;
  example?: string;
}

export interface SerializedTool {
  name: string;
  functionBody: string;
  schema: Record<string, SerializedToolSchema>;
  templateType?: string;
  config?: Record<string, any>;
}

/**
 * Extracts schema information from a Zod schema object
 */
export function extractZodSchemaInfo(validator: z.ZodTypeAny): SerializedToolSchema {
  if (validator instanceof z.ZodString) {
    return {
      type: 'string',
      description: validator.description || undefined,
      required: !validator.isOptional()
    };
  } else if (validator instanceof z.ZodNumber) {
    return {
      type: 'number',
      description: validator.description || undefined,
      required: !validator.isOptional()
    };
  } else if (validator instanceof z.ZodBoolean) {
    return {
      type: 'boolean',
      description: validator.description || undefined,
      required: !validator.isOptional()
    };
  } else if (validator instanceof z.ZodArray) {
    return {
      type: 'array',
      description: validator.description || undefined,
      required: !validator.isOptional()
    };
  } else if (validator instanceof z.ZodObject) {
    return {
      type: 'object',
      description: validator.description || undefined,
      required: !validator.isOptional()
    };
  }
  
  // Default fallback
  return {
    type: 'unknown',
    description: validator.description || undefined
  };
}

/**
 * Converts a serialized schema back to Zod validators
 */
export function createZodValidatorFromSchema(schema: SerializedToolSchema): z.ZodTypeAny {
  let validator: z.ZodTypeAny;
  
  switch (schema.type) {
    case 'string':
      validator = z.string();
      break;
    case 'number':
      validator = z.number();
      break;
    case 'boolean':
      validator = z.boolean();
      break;
    case 'array':
      validator = z.array(z.any());
      break;
    case 'object':
      validator = z.object({});
      break;
    default:
      validator = z.any();
  }
  
  if (schema.description) {
    validator = validator.describe(schema.description);
  }
  
  if (schema.required === false) {
    validator = validator.optional();
  }
  
  return validator;
}

/**
 * Class to manage tool functions storage and retrieval from Recall
 */
export class ToolManager {
  private recallClient: RecallClientManager;
  private bucketAddress: Address;
  
  constructor(bucketAddress: Address) {
    this.recallClient = RecallClientManager.getInstance();
    this.bucketAddress = bucketAddress;
  }
  
  /**
   * Store a tool function with its schema in a Recall bucket
   */
  async storeTool(
    toolName: string,
    paramSchema: Record<string, z.ZodTypeAny>,
    functionImplementation: Function
  ): Promise<string> {
    // Create a serializable representation of the tool
    const serializedSchema: Record<string, SerializedToolSchema> = {};
    
    // Extract schema information
    for (const [key, validator] of Object.entries(paramSchema)) {
      serializedSchema[key] = extractZodSchemaInfo(validator);
    }
    
    const serializedTool: SerializedTool = {
      name: toolName,
      functionBody: functionImplementation.toString(),
      schema: serializedSchema
    };
    
    // Store in Recall
    await this.recallClient.addObject(
      this.bucketAddress,
      `tools/${toolName}`,
      new TextEncoder().encode(JSON.stringify(serializedTool, null, 2)),
      { overwrite: true }
    );
    
    return `Tool ${toolName} stored successfully`;
  }
  
  /**
   * Store a tool using a template-based approach (more secure)
   */
  async storeTemplatedTool(
    toolName: string,
    paramSchema: Record<string, z.ZodTypeAny>,
    templateType: string,
    config: Record<string, any>
  ): Promise<string> {
    // Extract schema information
    const serializedSchema: Record<string, SerializedToolSchema> = {};
    
    for (const [key, validator] of Object.entries(paramSchema)) {
      serializedSchema[key] = extractZodSchemaInfo(validator);
    }
    
    const serializedTool: SerializedTool = {
      name: toolName,
      functionBody: '', // Not used with templates
      schema: serializedSchema,
      templateType,
      config
    };
    
    // Store in Recall - Encode to match storeTool method
    await this.recallClient.addObject(
      this.bucketAddress,
      `tools/${toolName}`,
      new TextEncoder().encode(JSON.stringify(serializedTool, null, 2)),
      { overwrite: true }
    );
    
    return `Templated tool ${toolName} stored successfully`;
  }
  
  /**
   * Load a tool function and its schema from a Recall bucket
   */
  async loadTool(toolName: string): Promise<{
    name: string;
    schema: Record<string, z.ZodTypeAny>;
    implementation: Function;
  }> {
    // Retrieve the serialized tool as binary data first
    const toolDataBinary = await this.recallClient.getObject(
      this.bucketAddress,
      `tools/${toolName}`
    );
    
    if (!toolDataBinary) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    // Decode the binary data
    const toolData = new TextDecoder().decode(toolDataBinary);
    
    // Parse the JSON
    const parsedTool = JSON.parse(toolData) as SerializedTool;
    
    // Reconstruct the schema
    const zodSchema: Record<string, z.ZodTypeAny> = {};
    
    for (const [key, schemaInfo] of Object.entries(parsedTool.schema)) {
      zodSchema[key] = createZodValidatorFromSchema(schemaInfo);
    }
    
    let implementation: Function;
    
    // Handle different types of tool functions
    if (parsedTool.templateType) {
      // Use template-based approach
      implementation = this.createFunctionFromTemplate(parsedTool.templateType, parsedTool.config || {});
    } else {
      // Direct function reconstruction (less secure, but more flexible)
      try {
        implementation = new Function(`return ${parsedTool.functionBody}`)();
      } catch (error) {
        throw new Error(`Failed to reconstruct function for tool ${toolName}: ${error}`);
      }
    }
    
    return {
      name: parsedTool.name,
      schema: zodSchema,
      implementation
    };
  }
  
  /**
   * Create a function from a template (safer approach)
   */
  private createFunctionFromTemplate(templateType: string, config: Record<string, any>): Function {
    switch (templateType) {
      case 'api_call':
        return async (args: Record<string, any>) => {
          const url = config.endpoint.replace(
            /\{([^}]+)\}/g,
            (_: string, key: string) => args[key]
          );
          
          const response = await fetch(url, {
            method: config.method || 'GET',
            headers: config.headers || { 'Content-Type': 'application/json' },
            ...(config.method !== 'GET' && args.body ? { body: JSON.stringify(args.body) } : {})
          });
          
          return await response.json();
        };
        
      case 'transformation':
        return (args: Record<string, any>) => {
          const inputField = config.inputField || Object.keys(args)[0];
          const input = args[inputField];
          
          switch (config.operation) {
            case 'uppercase':
              return typeof input === 'string' ? input.toUpperCase() : input;
            case 'lowercase':
              return typeof input === 'string' ? input.toLowerCase() : input;
            case 'trim':
              return typeof input === 'string' ? input.trim() : input;
            case 'parse_json':
              return typeof input === 'string' ? JSON.parse(input) : input;
            default:
              return input;
          }
        };
        
      // Add more template types as needed
        
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }
  
  /**
   * List all tools stored in the bucket
   */
  async listTools(): Promise<string[]> {
    const objects = await this.recallClient.listBucketObjects(this.bucketAddress);
    
    return objects
      .filter((obj: {key: string}) => obj.key.startsWith('tools/'))
      .map((obj: {key: string}) => obj.key.replace('tools/', ''));
  }
  
  /**
   * Register a tool with an MCP server
   */
  async registerToolWithMCP(server: any, toolName: string): Promise<string> {
    const tool = await this.loadTool(toolName);
    
    server.tool(
      tool.name,
      tool.schema,
      tool.implementation
    );
    
    return `Tool ${toolName} registered with MCP server`;
  }
}

// Example usage of the API for crypto price tool
/*
// Create API
const toolManager = new ToolManager('0xYourBucketAddress');

// Store template-based API tool
await toolManager.storeTemplatedTool(
  'get_crypto_price',
  { 
    coinName: z.string().describe('The name of the token, all in lower case letters.')
  },
  'api_call',
  {
    endpoint: 'https://api.coingecko.com/api/v3/simple/price?ids={coinName}&vs_currencies=usd',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  }
);

// Register with MCP server
import { MCPServer } from '@myorg/mcp-server';
const server = new MCPServer();
await toolManager.registerToolWithMCP(server, 'get_crypto_price');
*/ 