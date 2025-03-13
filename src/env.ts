import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to find and load the .env file from various possible locations
const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(__dirname, "../.env"),
  resolve(__dirname, "../../.env"),
];

let loaded = false;
for (const path of envPaths) {
  if (existsSync(path)) {
    config({ path });
    console.log(`Loaded environment variables from ${path}`);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn(
    "Could not find .env file. Make sure it exists in the project root.",
  );
}

// Sanitize sensitive environment variables for logging and display
// This function will redact the full value, showing only a few safe characters
export function sanitizeSecrets(obj: Record<string, any>) {
  const result = { ...obj };

  // Keys that should be considered sensitive and redacted
  const sensitiveKeys = [
    "private_key",
    "privatekey",
    "secret",
    "password",
    "pass",
    "key",
    "token",
    "auth",
    "credential",
    "sign",
    "encrypt",
  ];

  for (const key in result) {
    const lowerKey = key.toLowerCase();

    // Check if this is a sensitive key
    if (
      sensitiveKeys.some((sk) => lowerKey.includes(sk)) &&
      typeof result[key] === "string"
    ) {
      const value = result[key] as string;
      if (value.length > 8) {
        // Show only the first 4 and last 4 characters if long enough
        result[key] = `${value.substring(0, 4)}...${value.substring(
          value.length - 4,
        )}`;
      } else {
        // For shorter values, just show ****
        result[key] = "********";
      }
    }
  }

  return result;
}

// Verify that required environment variables are set
export function validateEnv() {
  const requiredVars = ["RECALL_PRIVATE_KEY", "RECALL_NETWORK"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  // Override the global console methods to prevent accidental logging of private keys
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;

  // Detect and redact any potential private key patterns in logs
  const redactPrivateKeys = (args: any[]) => {
    return args.map((arg) => {
      if (typeof arg === "string") {
        // Redact anything that looks like a private key (hex string of appropriate length)
        return (
          arg
            .replace(/0x[a-fA-F0-9]{64}/g, "[REDACTED_PRIVATE_KEY]")
            // Also redact if someone tries to log environment variables directly
            .replace(
              /(RECALL_PRIVATE_KEY|private_key|privatekey)=([^&\s]+)/gi,
              "$1=[REDACTED]",
            )
        );
      } else if (arg && typeof arg === "object") {
        // For objects, sanitize any keys that might contain sensitive data
        try {
          return sanitizeSecrets(arg);
        } catch (e) {
          return arg; // If we can't process it, return as is
        }
      }
      return arg;
    });
  };

  // Override console methods to redact sensitive information
  console.log = (...args: any[]) => {
    originalConsoleLog(...redactPrivateKeys(args));
  };

  console.error = (...args: any[]) => {
    originalConsoleError(...redactPrivateKeys(args));
  };

  console.info = (...args: any[]) => {
    originalConsoleInfo(...redactPrivateKeys(args));
  };

  console.warn = (...args: any[]) => {
    originalConsoleWarn(...redactPrivateKeys(args));
  };
}
