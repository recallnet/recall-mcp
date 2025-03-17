import { CallbackManagerForToolRun } from "@langchain/core/callbacks/manager";
import { RunnableConfig } from "@langchain/core/runnables";
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import RecallAPI from "../shared/api.js";

/**
 * A LangChain compatible structured tool for the Recall agent API.
 * @example
 * ```ts
 * const tool = new RecallTool(recallAPI, "get_account_info", "Get account info", getAccountInfoParameters);
 * ```
 */
class RecallTool extends StructuredTool {
  private _recall: RecallAPI;
  method: string;
  name: string;
  description: string;
  schema: z.ZodObject<any, any, any, any>;

  constructor(
    recallAPI: RecallAPI,
    method: string,
    description: string,
    schema: z.ZodObject<any, any, any, any, { [x: string]: any }>,
  ) {
    super();

    this._recall = recallAPI;
    this.method = method;
    this.name = method;
    this.description = description;
    this.schema = schema;
  }

  _call(
    arg: z.output<typeof this.schema>,
    _runManager?: CallbackManagerForToolRun,
    _parentConfig?: RunnableConfig,
  ): Promise<any> {
    return this._recall.run(this.method, arg);
  }
}

export default RecallTool;
