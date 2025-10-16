/**
 * Type definitions for email agent
 * Simplified for Mimecast email audit queries only
 */

// Mimecast search parameters
export interface MimecastSearchParams {
  status: 'blocked' | 'held' | 'rejected' | 'all';
  sender?: string;
  domain?: string;
  days?: number;
}

// Mimecast email result
export interface MimecastEmail {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  status: 'blocked' | 'held' | 'rejected';
  reason: string;
  timestamp: Date;
}

// Search result
export interface SearchResult {
  query: string;
  searchParams: MimecastSearchParams;
  emails: MimecastEmail[];
  totalCount: number;
  executionTime: number;
  timestamp: Date;
}

// LLM tool calling result
export interface ToolCallResult {
  toolName: string;
  parameters: MimecastSearchParams;
  rawQuery: string;
}

// Performance metrics
export interface PerformanceMetrics {
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
}
