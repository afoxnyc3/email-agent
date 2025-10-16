/**
 * Email Auditor
 * Orchestrates LLM query parsing and Mimecast email search
 * All functions are atomic (max 25 lines)
 */

import { appLogger } from '../lib/logger.js';
import { QueryParser } from '../services/query-parser.js';
import { MimecastClient } from '../services/mimecast-client.js';
import { SearchResult } from '../lib/types.js';

export class EmailAuditor {
  private initialized: boolean = false;
  private queryParser: QueryParser;
  private mimecastClient: MimecastClient;

  constructor() {
    this.queryParser = new QueryParser();
    this.mimecastClient = new MimecastClient();
  }

  /**
   * Initialize the auditor
   */
  async initialize(): Promise<void> {
    appLogger.info('Email Auditor initializing...');

    const mimecastHealthy = await this.mimecastClient.healthCheck();
    if (!mimecastHealthy) {
      throw new Error('Mimecast client health check failed');
    }

    this.initialized = true;
    appLogger.info('Email Auditor initialized successfully');
  }

  /**
   * Process natural language query
   */
  async processQuery(query: string): Promise<SearchResult> {
    if (!this.initialized) {
      throw new Error('EmailAuditor not initialized. Call initialize() first.');
    }

    appLogger.info('Processing query', { query });

    const startTime = Date.now();

    try {
      // Step 1: Parse query with LLM
      const searchParams = await this.queryParser.parseQuery(query);
      appLogger.debug('Query parsed', { searchParams });

      // Step 2: Search Mimecast
      const emails = await this.mimecastClient.searchMessages(searchParams);
      appLogger.debug('Mimecast search completed', { emailCount: emails.length });

      const executionTime = Date.now() - startTime;

      const result: SearchResult = {
        query,
        searchParams,
        emails,
        totalCount: emails.length,
        executionTime,
        timestamp: new Date(),
      };

      appLogger.info('Query processed successfully', {
        query,
        emailsFound: emails.length,
        executionTime,
      });

      return result;
    } catch (error: any) {
      appLogger.error('Query processing failed', { query, error: error.message });
      throw new Error(`Failed to process query: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const mimecastHealthy = await this.mimecastClient.healthCheck();
      return this.initialized && mimecastHealthy;
    } catch (error) {
      appLogger.error('Email auditor health check failed', { error });
      return false;
    }
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    appLogger.info('Email Auditor shutting down...');
    this.initialized = false;
  }
}
