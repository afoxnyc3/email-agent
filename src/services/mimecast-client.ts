/**
 * Mimecast API Client
 * Simplified client for searching blocked/held/rejected emails
 * All functions are atomic (max 25 lines)
 */

import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { appLogger } from '../lib/logger.js';
import { config } from '../lib/config.js';
import { MimecastSearchParams, MimecastEmail } from '../lib/types.js';

export class MimecastClient {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: config.mimecast.baseUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.axios.interceptors.request.use(
      (config) => this.addAuthHeaders(config),
      (error) => Promise.reject(error)
    );
  }

  /**
   * Search for emails
   */
  async searchMessages(params: MimecastSearchParams): Promise<MimecastEmail[]> {
    appLogger.info('Searching Mimecast messages', { params });

    const endpoint = '/api/message-finder/search';
    const requestData = this.buildSearchRequest(params);

    try {
      const response = await this.axios.post(endpoint, requestData);
      const emails = this.parseSearchResponse(response.data);

      appLogger.info('Mimecast search completed', {
        params,
        resultCount: emails.length,
      });

      return emails;
    } catch (error: any) {
      appLogger.error('Mimecast search failed', {
        params,
        error: error.message,
      });
      throw new Error(`Mimecast search failed: ${error.message}`);
    }
  }

  /**
   * Build search request
   */
  private buildSearchRequest(params: MimecastSearchParams): any {
    const daysAgo = params.days || 7;
    const start = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date().toISOString();

    const searchData: any = {
      start,
      end,
      advancedTrackAndTraceOptions: {},
    };

    if (params.sender) {
      searchData.searchBy = 'sender';
      searchData.query = params.sender;
    } else if (params.domain) {
      searchData.searchBy = 'sender';
      searchData.query = `@${params.domain}`;
    }

    if (params.status !== 'all') {
      searchData.advancedTrackAndTraceOptions.route = params.status;
    }

    return {
      meta: { pagination: { pageSize: 100 } },
      data: [searchData],
    };
  }

  /**
   * Parse search response
   */
  private parseSearchResponse(data: any): MimecastEmail[] {
    if (!data.data || data.data.length === 0) {
      return [];
    }

    return data.data.map((msg: any) => ({
      id: msg.id || '',
      subject: msg.subject || '(No Subject)',
      sender: msg.from || '',
      recipient: msg.to || '',
      status: msg.route || 'unknown',
      reason: msg.detectionLevel || 'Unknown',
      timestamp: new Date(msg.received || Date.now()),
    }));
  }

  /**
   * Add HMAC authentication headers
   */
  private addAuthHeaders(axiosConfig: any): any {
    const requestId = crypto.randomUUID();
    const date = new Date().toUTCString();

    const dataToSign = `${date}:${requestId}:${axiosConfig.url}:${config.mimecast.appKey}`;
    const hmac = crypto.createHmac('sha1', Buffer.from(config.mimecast.secretKey, 'base64'));
    hmac.update(dataToSign);
    const signature = hmac.digest('base64');

    axiosConfig.headers['x-mc-req-id'] = requestId;
    axiosConfig.headers['x-mc-date'] = date;
    axiosConfig.headers['x-mc-app-id'] = config.mimecast.appId;
    axiosConfig.headers['Authorization'] = `MC ${config.mimecast.accessKey}:${signature}`;

    return axiosConfig;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.axios.post('/api/account/get-account', { meta: {}, data: [] });
      return true;
    } catch (error) {
      appLogger.error('Mimecast health check failed', { error });
      return false;
    }
  }
}
