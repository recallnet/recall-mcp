import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

import RecallAPI from "../shared/api.js";
import { Configuration, isToolAllowed } from "../shared/configuration.js";
import { tools } from "../shared/tools.js";

class RecallAgentToolkit extends McpServer {
  private _recall: RecallAPI;

  constructor({
    privateKey,
    configuration,
  }: {
    privateKey: string;
    configuration: Configuration;
  }) {
    super({
      name: "Recall",
      version: "0.0.1",
      description: "Recall storage for memory and context retrieval",
    });

    this._recall = new RecallAPI(privateKey, configuration.context);

    const filteredTools = tools.filter((tool: any) =>
      isToolAllowed(tool, configuration),
    );

    filteredTools.forEach((tool: any) => {
      this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (arg: any, _extra: RequestHandlerExtra) => {
          const result = await this._recall.run(tool.method, arg);
          return {
            content: [
              {
                type: "text" as const,
                text: String(result),
              },
            ],
          };
        },
      );
    });
  }
}

export default RecallAgentToolkit;
