/**
 * Email Agent - Main Entry Point
 * Teams bot for Mimecast email audit queries
 */

import { appLogger } from './lib/logger.js';
import { config } from './lib/config.js';
import { EmailAuditor } from './agents/email-auditor.js';
import { createTeamsBotAdapter } from './teams/bot-adapter.js';
import { TeamsMessageHandler } from './teams/message-handler.js';
import { HttpServer } from './server.js';

/**
 * Main application
 */
class Application {
  private emailAuditor!: EmailAuditor;
  private httpServer!: HttpServer;

  /**
   * Initialize application
   */
  async initialize(): Promise<void> {
    appLogger.info('Initializing Email Agent...');

    // Initialize email auditor
    this.emailAuditor = new EmailAuditor();
    await this.emailAuditor.initialize();

    // Initialize Teams bot
    const botAdapter = createTeamsBotAdapter();
    const messageHandler = new TeamsMessageHandler(this.emailAuditor);

    // Initialize HTTP server
    this.httpServer = new HttpServer();
    this.httpServer.setEmailAuditor(this.emailAuditor);
    this.httpServer.setBotAdapter(botAdapter, (context) => messageHandler.handleMessage(context));

    appLogger.info('Email Agent initialized successfully');
  }

  /**
   * Start application
   */
  async start(): Promise<void> {
    appLogger.info('Starting Email Agent...');

    await this.httpServer.start();

    appLogger.info('Email Agent started successfully', {
      port: config.server.port,
      environment: config.server.environment,
    });
  }

  /**
   * Stop application
   */
  async stop(): Promise<void> {
    appLogger.info('Stopping Email Agent...');
    await this.emailAuditor.shutdown();
    appLogger.info('Email Agent stopped');
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers(): void {
    const shutdown = async (signal: string) => {
      appLogger.info(`Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Handle errors
   */
  setupErrorHandlers(): void {
    process.on('uncaughtException', (error) => {
      appLogger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      appLogger.error('Unhandled rejection', { reason });
      process.exit(1);
    });
  }
}

/**
 * Main function
 */
async function main() {
  const app = new Application();

  try {
    app.setupSignalHandlers();
    app.setupErrorHandlers();

    await app.initialize();
    await app.start();

    appLogger.info('Email Agent is running');
  } catch (error: any) {
    appLogger.error('Failed to start Email Agent', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Run application
main();
