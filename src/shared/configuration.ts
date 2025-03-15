import type { Address } from "viem";

// TODO:
// - `get_credit_info` fails with bigint serialization errors

// import { ChainName } from "@recallnet/chains";

import type { Tool } from "./tools.js";

/**
 * Resources are categories for tool calls and come with a set of permissions. For example, an
 * action called `bucket.read` will only be allowed if a tool has defined the `bucket` as its
 * resource and has the `read` permission set.
 */
export type Resource = "account" | "bucket" | "documentation";

/**
 * Permissions are used alongside resources to restrict how a tool can be used. Write operations
 * are associated with a private key and are not allowed to be called without one, while read
 * operations are open to anyone (e.g., reading Recall network information).
 */
export type Permission = "read" | "write";

/**
 * Actions are used to restrict the subset of API calls that can be made. Setting a permission
 * to false prevents the related "tool" from being considered. For example, if no private key is
 * provided, the `write` permission should be set to false.
 * @example
 * ```ts
 * const actions: Actions = {
 *   bucket: {
 *     write: true,
 *   },
 * }
 * ```
 */
export type Actions = {
  [K in Resource]?: {
    [K in Permission]?: boolean;
  };
};

// TODO: figure out what we need to pass here
/**
 * Context are settings that are applied to all requests made by the integration.
 * @param account - An EVM account address.
 */
export type Context = {
  account?: string | Address;
  // network?: string | ChainName;
};

/**
 * Configuration provides various settings and options for the integration to tune and manage how
 * it behaves.
 * @param actions - Restricts the subset of API calls ({@link Actions}) that can be made.
 * @param context - {@link Context} are settings that are applied to all requests made by the integration.
 */
export type Configuration = {
  actions?: Actions;
  context?: Context;
};

/**
 * Checks if a tool is allowed to be used based on the configuration.
 * @param tool - The {@link Tool} to check.
 * @param configuration - The {@link Configuration} to check against.
 * @returns `true` if the tool is allowed, `false` otherwise.
 */
export const isToolAllowed = (
  tool: Tool,
  configuration: Configuration,
): boolean => {
  return Object.keys(tool.actions).every((resource) => {
    // For each resource.permission pair, check the configuration.
    const permissions = tool.actions[resource as Resource];
    if (!permissions) {
      return false;
    }

    return Object.keys(permissions).every((permission) => {
      return (
        configuration.actions?.[resource as Resource]?.[
          permission as Permission
        ] === true
      );
    });
  });
};
