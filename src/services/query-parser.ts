/**
 * LLM Query Parser
 * Uses Anthropic Claude with tool calling to parse natural language queries
 * All functions are atomic (max 25 lines)
 */

import Anthropic from '@anthropic-ai/sdk';
import { appLogger } from '../lib/logger.js';
import { config } from '../lib/config.js';
import { MimecastSearchParams, ToolCallResult } from '../lib/types.js';

export class QueryParser {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });
  }

  /**
   * Parse natural language query to Mimecast search parameters
   */
  async parseQuery(query: string): Promise<MimecastSearchParams> {
    appLogger.info('Parsing query with LLM', { query });

    const startTime = Date.now();

    try {
      const response = await this.anthropic.messages.create({
        model: config.anthropic.model,
        max_tokens: 1024,
        tools: [this.getMimecastSearchTool()],
        messages: [{ role: 'user', content: query }],
      });

      const duration = Date.now() - startTime;

      const toolCall = this.extractToolCall(response);
      appLogger.info('Query parsed successfully', { query, duration, parameters: toolCall.parameters });

      return toolCall.parameters;
    } catch (error: any) {
      appLogger.error('Query parsing failed', { query, error: error.message });
      throw new Error(`Failed to parse query: ${error.message}`);
    }
  }

  /**
   * Get Mimecast search tool definition
   */
  private getMimecastSearchTool(): any {
    return {
      name: 'search_mimecast',
      description: 'Search Mimecast for blocked, held, or rejected emails. Use this tool to find emails that were stopped by Mimecast security.',
      input_schema: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['blocked', 'held', 'rejected', 'all'],
            description: 'Email status to search for',
          },
          sender: {
            type: 'string',
            description: 'Email address or domain to search for (e.g., user@example.com or example.com)',
          },
          days: {
            type: 'number',
            description: 'Number of days to search back (default: 7)',
            default: 7,
          },
        },
        required: ['status'],
      },
    };
  }

  /**
   * Extract tool call from response
   */
  private extractToolCall(response: any): ToolCallResult {
    const content = response.content;

    if (!content || content.length === 0) {
      throw new Error('No response from LLM');
    }

    const toolUse = content.find((block: any) => block.type === 'tool_use');

    if (!toolUse) {
      throw new Error('LLM did not use the search_mimecast tool. Please rephrase your query.');
    }

    return {
      toolName: toolUse.name,
      parameters: this.validateParameters(toolUse.input),
      rawQuery: '',
    };
  }

  /**
   * Validate and normalize parameters
   */
  private validateParameters(input: any): MimecastSearchParams {
    const params: MimecastSearchParams = {
      status: input.status || 'all',
      days: input.days || 7,
    };

    if (input.sender) {
      if (input.sender.includes('@')) {
        params.sender = input.sender;
      } else {
        params.domain = input.sender;
      }
    }

    return params;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.parseQuery('Show blocked emails from test@example.com');
      return true;
    } catch {
      return false;
    }
  }
}
