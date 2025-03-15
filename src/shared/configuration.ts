import type { Address } from "viem";

// import { ChainName } from "@recallnet/chains";

import type { Tool } from "./tools.js";

// Actions restrict the subset of API calls that can be made. They should
// be used in conjunction with Restricted API Keys. Setting a permission to false
// prevents the related "tool" from being considered.
export type Object = "account" | "buckets" | "documentation";

export type Permission = "write" | "read";

export type Actions = {
  [K in Object]?: {
    [K in Permission]?: boolean;
  };
};

// Context are settings that are applied to all requests made by the integration.
export type Context = {
  // Account is a Stripe Connected Account ID. If set, the integration will
  // make requests for this Account.
  account?: string | Address;
  // network?: string | ChainName;
};

// Configuration provides various settings and options for the integration
// to tune and manage how it behaves.
export type Configuration = {
  actions?: Actions;
  context?: Context;
};

export const isToolAllowed = (
  tool: Tool,
  configuration: Configuration,
): boolean => {
  return Object.keys(tool.actions).every((resource) => {
    // For each resource.permission pair, check the configuration.
    const permissions = tool.actions[resource as Object];
    if (!permissions) {
      return false;
    }

    return Object.keys(permissions).every((permission) => {
      return (
        configuration.actions?.[resource as Object]?.[
          permission as Permission
        ] === true
      );
    });
  });
};
