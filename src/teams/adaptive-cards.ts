/**
 * Adaptive Cards for Mimecast Search Results
 * All functions are atomic (max 25 lines)
 */

import { Attachment, CardFactory } from 'botbuilder';
import { SearchResult, MimecastEmail } from '../lib/types.js';

/**
 * Create search results card
 */
export function createSearchResultsCard(result: SearchResult): Attachment {
  const { query, emails, totalCount, executionTime } = result;

  const card = {
    type: 'AdaptiveCard',
    version: '1.4',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    body: [
      buildHeaderSection(query, totalCount, executionTime),
      ...buildEmailSections(emails),
      buildFooterSection(),
    ],
  };

  return CardFactory.adaptiveCard(card);
}

/**
 * Build header section
 */
function buildHeaderSection(query: string, totalCount: number, executionTime: number): any {
  return {
    type: 'Container',
    style: totalCount > 0 ? 'attention' : 'good',
    items: [
      {
        type: 'TextBlock',
        text: totalCount > 0 ? `📧 Found ${totalCount} Email(s)` : '✅ No Emails Found',
        weight: 'bolder',
        size: 'large',
      },
      {
        type: 'TextBlock',
        text: `Query: "${query}" • ${executionTime}ms`,
        size: 'small',
        isSubtle: true,
      },
    ],
  };
}

/**
 * Build email sections
 */
function buildEmailSections(emails: MimecastEmail[]): any[] {
  return emails.slice(0, 10).map((email) => ({
    type: 'Container',
    separator: true,
    items: [
      {
        type: 'TextBlock',
        text: email.subject || '(No Subject)',
        weight: 'bolder',
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'From:', value: email.sender },
          { title: 'To:', value: email.recipient },
          { title: 'Status:', value: email.status.toUpperCase() },
          { title: 'Reason:', value: email.reason },
          { title: 'Date:', value: new Date(email.timestamp).toLocaleString() },
        ],
      },
    ],
  }));
}

/**
 * Build footer section
 */
function buildFooterSection(): any {
  return {
    type: 'Container',
    items: [
      {
        type: 'TextBlock',
        text: 'Email Agent • Powered by Anthropic Claude',
        size: 'small',
        color: 'dark',
        isSubtle: true,
      },
    ],
  };
}

/**
 * Create error card
 */
export function createErrorCard(errorMessage: string): Attachment {
  const card = {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'Container',
        style: 'attention',
        items: [
          {
            type: 'TextBlock',
            text: '⚠️ Error',
            weight: 'bolder',
            size: 'large',
          },
          {
            type: 'TextBlock',
            text: errorMessage,
            wrap: true,
          },
        ],
      },
    ],
  };

  return CardFactory.adaptiveCard(card);
}

/**
 * Create welcome card
 */
export function createWelcomeCard(): Attachment {
  const card = {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'Container',
        style: 'emphasis',
        items: [
          {
            type: 'TextBlock',
            text: '📧 Email Agent',
            weight: 'bolder',
            size: 'extraLarge',
          },
          {
            type: 'TextBlock',
            text: 'Query Mimecast email audit logs using natural language',
            wrap: true,
            isSubtle: true,
          },
        ],
      },
      {
        type: 'Container',
        items: [
          {
            type: 'TextBlock',
            text: 'Example Queries',
            weight: 'bolder',
            size: 'medium',
          },
          {
            type: 'TextBlock',
            text: '• "Show blocked emails from sender@example.com"\n• "List held emails from last 7 days"\n• "Check rejected emails from domain.com"',
            wrap: true,
          },
        ],
      },
    ],
  };

  return CardFactory.adaptiveCard(card);
}
