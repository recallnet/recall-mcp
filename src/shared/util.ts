/**
 * JSON stringify with bigint support.
 * @param obj - The object to stringify.
 * @returns The stringified object.
 */
export function jsonStringify(obj: any) {
  return JSON.stringify(obj, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}
