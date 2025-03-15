#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { RecallAgentToolkit } from "../mcp/index.js";
import { Configuration } from "../shared/configuration.js";

type Options = {
  tools?: string[];
  privateKey?: string;
};

// Get the directory where this script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root (two levels up if in build directory)
const envPath = resolve(__dirname, "..", "..", ".env");
config({ path: envPath });

const { RECALL_PRIVATE_KEY } = process.env;

// The server will accept flags for a `--private-key` (hex string) and `--tools` (comma separated list)
const ACCEPTED_ARGS = ["private-key", "tools"];

// Note: since we require a private key, we only expose both read and write tools
const ACCEPTED_TOOLS = [
  "account.read",
  "account.write",
  "bucket.read",
  "bucket.write",
  "documentation.read",
];

export function parseArgs(args: string[]): Options {
  const options: Options = {};

  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");

      if (key == "tools") {
        options.tools = value?.split(",");
      } else if (key == "private-key") {
        options.privateKey = value;
      } else {
        throw new Error(
          `Invalid argument: ${key}. Accepted arguments are: ${ACCEPTED_ARGS.join(
            ", ",
          )}`,
        );
      }
    }
  });

  // Check if required tools arguments is present
  if (!options.tools) {
    throw new Error("The --tools arguments must be provided.");
  }

  // Validate tools against accepted enum values
  options.tools.forEach((tool: string) => {
    if (tool == "all") {
      return;
    }
    if (!ACCEPTED_TOOLS.includes(tool.trim())) {
      throw new Error(
        `Invalid tool: ${tool}. Accepted tools are: ${ACCEPTED_TOOLS.join(
          ", ",
        )}`,
      );
    }
  });

  // Check if API key is either provided in args or set in environment variables
  const privateKey = options.privateKey || RECALL_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "Recall private key not provided. Please either pass it as an argument --private-key=$KEY or set the RECALL_PRIVATE_KEY environment variable.",
    );
  }
  options.privateKey = privateKey;

  return options;
}

function handleError(error: any) {
  console.error("\n🚨  Error initializing Recall MCP server:\n");
  console.error(`   ${error.message}\n`);
}

export async function main() {
  const options = parseArgs(process.argv.slice(2));

  // Create the RecallAgentToolkit instance
  const selectedTools = options.tools!;
  const configuration: Configuration = { actions: {} };

  if (selectedTools.includes("all")) {
    ACCEPTED_TOOLS.forEach((tool) => {
      const [product, action] = tool.split(".");
      // @ts-ignore
      configuration.actions[product] = {
        // @ts-ignore
        ...configuration.actions[product],
        // @ts-ignore
        [action]: true,
      };
    });
  } else {
    selectedTools.forEach((tool: any) => {
      const [product, action] = tool.split(".");
      // @ts-ignore
      configuration.actions[product] = { [action]: true };
    });
  }

  // Append stripe account to configuration if provided
  if (options.privateKey) {
    configuration.context = { account: options.privateKey };
  }

  const server = new RecallAgentToolkit({
    privateKey: options.privateKey!,
    configuration: configuration,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // We use console.error instead of console.log since console.log will output to stdio, which will confuse the MCP server
  console.error("✅ Recall MCP Server running on stdio");
}

main().catch((error) => {
  handleError(error);
});
