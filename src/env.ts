// env.ts - Simplified to work exclusively with environment variables

// Only log a debug message
if (process.env.DEBUG) {
  console.error('Using environment variables from Cursor config.json');
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