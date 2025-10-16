/**
 * Teams Message Handler
 * Processes Teams messages and routes to email auditor
 * All functions are atomic (max 25 lines)
 */

import { TurnContext, ActivityTypes } from 'botbuilder';
import { appLogger } from '../lib/logger.js';
import { EmailAuditor } from '../agents/email-auditor.js';
import { createSearchResultsCard, createErrorCard, createWelcomeCard } from './adaptive-cards.js';

export class TeamsMessageHandler {
  constructor(private emailAuditor: EmailAuditor) {}

  /**
   * Handle incoming message
   */
  async handleMessage(context: TurnContext): Promise<void> {
    if (context.activity.type !== ActivityTypes.Message) {
      return;
    }

    const text = context.activity.text?.trim();
    if (!text) {
      await context.sendActivity({ attachments: [createWelcomeCard()] });
      return;
    }

    appLogger.info('Processing Teams message', {
      userId: context.activity.from?.id,
      conversationId: context.activity.conversation?.id,
      query: text,
    });

    await this.processQuery(context, text);
  }

  /**
   * Process query
   */
  private async processQuery(context: TurnContext, query: string): Promise<void> {
    try {
      const result = await this.emailAuditor.processQuery(query);

      await context.sendActivity({
        attachments: [createSearchResultsCard(result)],
      });

      appLogger.info('Query processed successfully', {
        query,
        emailsFound: result.totalCount,
        executionTime: result.executionTime,
      });
    } catch (error: any) {
      appLogger.error('Query processing failed', { query, error: error.message });

      await context.sendActivity({
        attachments: [createErrorCard(error.message || 'Query processing failed')],
      });
    }
  }
}
