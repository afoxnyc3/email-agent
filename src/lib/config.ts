/**
 * Configuration management for email agent
 */

import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) throw new Error(`Invalid number for ${key}: ${value}`);
  return num;
}

export const config = {
  azure: {
    tenantId: getEnv('AZURE_TENANT_ID'),
    clientId: getEnv('AZURE_CLIENT_ID'),
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },

  teams: {
    appId: getEnv('MICROSOFT_APP_ID'),
    appPassword: process.env.MICROSOFT_APP_PASSWORD,
    appType: getEnv('MICROSOFT_APP_TYPE', 'MultiTenant'),
    tenantId: getEnv('MICROSOFT_APP_TENANT_ID'),
  },

  anthropic: {
    apiKey: getEnv('ANTHROPIC_API_KEY'),
    model: getEnv('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
  },

  mimecast: {
    baseUrl: getEnv('MIMECAST_BASE_URL', 'https://api.mimecast.com'),
    appId: getEnv('MIMECAST_APP_ID'),
    appKey: getEnv('MIMECAST_APP_KEY'),
    accessKey: getEnv('MIMECAST_ACCESS_KEY'),
    secretKey: getEnv('MIMECAST_SECRET_KEY'),
  },

  server: {
    port: getEnvNumber('PORT', 3978),
    environment: getEnv('NODE_ENV', 'development'),
  },
};
