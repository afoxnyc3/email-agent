/**
 * Teams Bot Adapter
 * Microsoft Teams Bot Framework authentication
 * All functions are atomic (max 25 lines)
 */

import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
  TurnContext,
} from 'botbuilder';
import { config } from '../lib/config.js';
import { appLogger } from '../lib/logger.js';

/**
 * Create Teams bot adapter
 */
export function createTeamsBotAdapter(): CloudAdapter {
  const authConfig: any = {
    MicrosoftAppId: config.teams.appId,
    MicrosoftAppType: config.teams.appType,
    MicrosoftAppTenantId: config.teams.tenantId,
  };

  appLogger.info('Configuring Teams bot authentication', {
    appId: config.teams.appId,
    appType: authConfig.MicrosoftAppType,
    tenantId: config.teams.tenantId,
  });

  if (config.teams.appPassword) {
    authConfig.MicrosoftAppPassword = config.teams.appPassword;
  }

  const credentialsFactory = new ConfigurationServiceClientCredentialFactory(authConfig);
  const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
  const adapter = new CloudAdapter(botFrameworkAuthentication);

  adapter.onTurnError = createErrorHandler();

  appLogger.info('Teams bot adapter created successfully');
  return adapter;
}

/**
 * Create error handler
 */
function createErrorHandler() {
  return async (context: TurnContext, error: Error) => {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    appLogger.error('Teams bot error occurred', {
      errorId,
      error: error.message,
      conversationId: context.activity?.conversation?.id,
    });

    try {
      await context.sendActivity(`Sorry, something went wrong. Error ID: ${errorId}`);
    } catch (sendError) {
      appLogger.error('Failed to send error message', { errorId, sendError });
    }
  };
}
