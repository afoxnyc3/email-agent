/**
 * HTTP Server
 * Restify server for Teams bot messages and health checks
 * All functions are atomic (max 25 lines)
 */

import * as restify from 'restify';
import { appLogger } from './lib/logger.js';
import { config } from './lib/config.js';
import { CloudAdapter } from 'botbuilder';
import { EmailAuditor } from './agents/email-auditor.js';

export class HttpServer {
  private server: restify.Server;
  private botAdapter?: CloudAdapter;
  private emailAuditor?: EmailAuditor;
  private messageHandler?: (context: any) => Promise<void>;

  constructor() {
    this.server = restify.createServer();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.server.use(restify.plugins.bodyParser());
    this.server.pre((req, res, next) => {
      appLogger.debug('HTTP request', {
        method: req.method,
        path: req.path(),
        ip: req.connection.remoteAddress,
      });
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    this.server.get('/health', this.handleHealth.bind(this));
    this.server.get('/ready', this.handleReady.bind(this));
    this.server.post('/api/messages', this.handleTeamsMessage.bind(this));
  }

  /**
   * Handle health check
   */
  private handleHealth(req: restify.Request, res: restify.Response): void {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  /**
   * Handle readiness check
   */
  private async handleReady(req: restify.Request, res: restify.Response): Promise<void> {
    const auditorHealthy = this.emailAuditor ? await this.emailAuditor.healthCheck() : false;

    res.json({
      status: auditorHealthy ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      emailAuditor: auditorHealthy,
    });
  }

  /**
   * Handle Teams messages
   */
  private async handleTeamsMessage(req: restify.Request, res: restify.Response): Promise<void> {
    if (!this.botAdapter || !this.messageHandler) {
      res.send(503, 'Bot not initialized');
      return;
    }

    await this.botAdapter.process(req, res as any, this.messageHandler);
  }

  /**
   * Set bot adapter
   */
  setBotAdapter(adapter: CloudAdapter, messageHandler: (context: any) => Promise<void>): void {
    this.botAdapter = adapter;
    this.messageHandler = messageHandler;
  }

  /**
   * Set email auditor
   */
  setEmailAuditor(auditor: EmailAuditor): void {
    this.emailAuditor = auditor;
  }

  /**
   * Start server
   */
  async start(): Promise<void> {
    const port = config.server.port;

    return new Promise((resolve) => {
      this.server.listen(port, () => {
        appLogger.info('HTTP server started', { port });
        resolve();
      });
    });
  }
}
