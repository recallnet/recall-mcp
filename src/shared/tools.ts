import { z } from "zod";

import { getAccountInfoParameters } from "./parameters.js";
import { getAccountInfoPrompt } from "./prompts.js";

export type Tool = {
  method: string;
  name: string;
  description: string;
  parameters: z.ZodObject<any, any, any, any>;
  actions: {
    [key: string]: {
      [action: string]: boolean;
    };
  };
};

export const tools: Tool[] = [
  {
    method: "get_account_info",
    name: "Get Account Info",
    description: getAccountInfoPrompt,
    parameters: getAccountInfoParameters,
    actions: {
      account: {
        read: true,
      },
    },
  },
];
