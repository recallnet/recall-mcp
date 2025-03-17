// env.ts - Enhanced to support both direct environment variables and .env file as fallback
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Only log a debug message
if (process.env.DEBUG) {
  console.error('Starting environment setup...');
}

// Check if the required environment variables are already set (from Cursor/Claude/Windsurf config)
const hasRequiredEnvVars = !!process.env.RECALL_PRIVATE_KEY;

// Only attempt to load .env file if required variables are not already set
if (!hasRequiredEnvVars) {
  // Get the directory of the current module
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try to find and load the .env file from various possible locations
  const envPaths = [
    resolve(process.cwd(), '.env'),
    resolve(__dirname, '../.env'),
    resolve(__dirname, '../../.env')
  ];

  let loaded = false;
  for (const path of envPaths) {
    if (existsSync(path)) {
      config({ path });
      loaded = true;
      if (process.env.DEBUG) {
        console.error(`Loaded environment from .env file at: ${path}`);
      }
      break;
    }
  }

  if (!loaded && process.env.DEBUG) {
    console.error('No .env file found. Using environment variables directly.');
  }
} else if (process.env.DEBUG) {
  console.error('Using environment variables from configuration.');
}

// Sanitize sensitive environment variables for logging and display
export function sanitizeSecrets(obj: Record<string, any>) {
  const result = { ...obj };
  
  // Keys that should be considered sensitive and redacted
  const sensitiveKeys = [
    'private_key', 'privatekey', 'secret', 'password', 'pass', 'key',
    'token', 'auth', 'credential', 'sign', 'encrypt'
  ];
  
  for (const key in result) {
    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive key
    if (sensitiveKeys.some(sk => lowerKey.includes(sk)) && typeof result[key] === 'string') {
      const value = result[key] as string;
      if (value.length > 8) {
        // Show only the first 4 and last 4 characters if long enough
        result[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      } else {
        // For shorter values, just show ****
        result[key] = '********';
      }
    }
  }
  
  return result;
}

// Verify that required environment variables are set
export function validateEnv() {
  const requiredVars = ['RECALL_PRIVATE_KEY'];
  const recommendedVars = ['RECALL_NETWORK'];
  
  // Check for required variables
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Check for recommended variables
  const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
  
  if (missingRecommended.length > 0 && process.env.DEBUG) {
    console.warn(`Missing recommended environment variables: ${missingRecommended.join(', ')}. Using defaults.`);
  }
  
  // Set up security for console output
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  const redactPrivateKeys = (args: any[]) => {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return arg.replace(/0x[a-fA-F0-9]{64}/g, '[REDACTED_PRIVATE_KEY]')
                  .replace(/(RECALL_PRIVATE_KEY|private_key|privatekey)=([^&\s]+)/gi, '$1=[REDACTED]');
      } else if (arg && typeof arg === 'object') {
        try {
          return sanitizeSecrets(arg);
        } catch (e) {
          return arg;
        }
      }
      return arg;
    });
  };
  
  console.error = (...args: any[]) => {
    originalConsoleError(...redactPrivateKeys(args));
  };
  
  console.warn = (...args: any[]) => {
    originalConsoleWarn(...redactPrivateKeys(args));
  };
}