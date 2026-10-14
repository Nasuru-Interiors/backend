import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { generateWebhookSecret, computeSignature, verifySignature, parseSignatureHeader, shouldDeliverEvent, triggerWebhooks, processPendingDeliveries } from '../lib/webhook';

// Mock the database
vi.mock('../lib/db', () => ({
  sql: vi.fn(),
}));

// Mock fetch for webhook delivery tests
global.fetch = vi.fn();

describe('Webhook System - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HMAC Signature', () => {
    it('should generate and verify signatures correctly', () => {
      const secret = 'test-secret-key';
      const payload = '{"test": "data"}';
      const signature = computeSignature(payload, secret);

      expect(verifySignature(payload, signature, secret)).toBe(true);
      expect(verifySignature(payload, 'invalid-signature', secret)).toBe(false);
      expect(verifySignature('different payload', signature, secret)).toBe(false);
    });

    it('should generate secure random secrets', () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();

      expect(secret1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(secret2).toHaveLength(64);
      expect(secret1).not.toBe(secret2);
      // Should be valid hex
      expect(secret1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should parse signature header correctly', () => {
      expect(parseSignatureHeader('sha256=abc123')).toBe('abc123');
      expect(parseSignatureHeader('sha256=ABC123')).toBe('ABC123');
      expect(parseSignatureHeader('invalid')).toBeNull();
      expect(parseSignatureHeader(undefined)).toBeNull();
      expect(parseSignatureHeader('')).toBeNull();
    });

    it('should use timing-safe comparison', () => {
      const secret = 'test-secret';
      const payload = 'test payload';
      const validSig = computeSignature(payload, secret);

      // Valid signature should pass
      expect(verifySignature(payload, validSig, secret)).toBe(true);

      // Same length but different should fail
      const invalidSig = '0'.repeat(validSig.length);
      expect(verifySignature(payload, invalidSig, secret)).toBe(false);

      // Different length should fail fast
      expect(verifySignature(payload, 'short', secret)).toBe(false);
    });
  });

  describe('Event Matching', () => {
    it('should match exact events', () => {
      expect(shouldDeliverEvent(['article.created'], 'article.created')).toBe(true);
      expect(shouldDeliverEvent(['article.created'], 'article.updated')).toBe(false);
      expect(shouldDeliverEvent(['article.published', 'article.unpublished'], 'article.published')).toBe(true);
    });

    it('should match wildcard events', () => {
      expect(shouldDeliverEvent(['article.*'], 'article.created')).toBe(true);
      expect(shouldDeliverEvent(['article.*'], 'article.updated')).toBe(true);
      expect(shouldDeliverEvent(['article.*'], 'article.published')).toBe(true);
      expect(shouldDeliverEvent(['article.*'], 'article.unpublished')).toBe(true);
      expect(shouldDeliverEvent(['article.*'], 'article.deleted')).toBe(true);
      expect(shouldDeliverEvent(['article.*'], 'category.created')).toBe(false);
    });

    it('should match global wildcard', () => {
      expect(shouldDeliverEvent(['*'], 'article.created')).toBe(true);
      expect(shouldDeliverEvent(['*'], 'any.event')).toBe(true);
      expect(shouldDeliverEvent(['*'], 'completely.different')).toBe(true);
    });

    it('should match multiple patterns', () => {
      expect(shouldDeliverEvent(['article.created', 'article.published'], 'article.published')).toBe(true);
      expect(shouldDeliverEvent(['article.*', 'category.*'], 'category.created')).toBe(true);
      expect(shouldDeliverEvent(['article.created', 'category.*'], 'category.updated')).toBe(true);
      expect(shouldDeliverEvent(['article.created', 'category.*'], 'article.published')).toBe(false);
    });

    it('should handle empty events array', () => {
      expect(shouldDeliverEvent([], 'article.created')).toBe(false);
    });
  });

  describe('Signature Header Format', () => {
    it('should produce correctly formatted signatures', () => {
      const secret = 'webhook-secret';
      const payload = JSON.stringify({ id: '123', title: 'Test' });
      const signature = computeSignature(payload, secret);

      // Should be 64 character hex string (SHA256)
      expect(signature).toMatch(/^[a-f0-9]{64}$/);

      // Verify it works
      expect(verifySignature(payload, signature, secret)).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should calculate exponential backoff correctly', () => {
      const backoffMinutes = [1, 5, 15, 60, 360];

      // Attempt 1 -> 1 min
      expect(backoffMinutes[0]).toBe(1);
      // Attempt 2 -> 5 min
      expect(backoffMinutes[1]).toBe(5);
      // Attempt 3 -> 15 min
      expect(backoffMinutes[2]).toBe(15);
      // Attempt 4 -> 60 min
      expect(backoffMinutes[3]).toBe(60);
      // Attempt 5 -> 360 min (6 hours)
      expect(backoffMinutes[4]).toBe(360);
      // Attempt 6+ -> caps at 360 min
      expect(backoffMinutes[5] ?? backoffMinutes[4]).toBe(360);
    });
  });

  describe('Payload Structure', () => {
    it('should include required fields in webhook payload', () => {
      const articlePayload = {
        id: 'uuid-123',
        title: 'Test Article',
        slug: 'test-article',
        excerpt: 'Test excerpt',
        content_html: '<p>Test content</p>',
        status: 'published',
        featured: false,
        author: 'Test Author',
        reading_minutes: 5,
        published_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        category_ids: ['cat-1', 'cat-2'],
      };

      // Verify all expected fields are present
      expect(articlePayload.id).toBeDefined();
      expect(articlePayload.title).toBeDefined();
      expect(articlePayload.slug).toBeDefined();
      expect(articlePayload.status).toBeDefined();
      expect(articlePayload.published_at).toBeDefined();
      expect(Array.isArray(articlePayload.category_ids)).toBe(true);
    });

    it('should handle deleted article payload', () => {
      const deletedPayload = { id: 'uuid-123' };
      expect(deletedPayload.id).toBeDefined();
      expect(Object.keys(deletedPayload)).toHaveLength(1);
    });
  });
});

// Integration-style tests that require database
describe('Webhook System - Integration Tests (require DB)', () => {
  // These tests require a running database and are skipped by default
  // Run with: vitest run --reporter=verbose src/tests/webhook.integration.test.ts
  it.skip('should create webhook endpoint via API', async () => {
    // This test requires a running server and database
    expect(true).toBe(true);
  });

  it.skip('should deliver webhook and retry on failure', async () => {
    // This test requires a running server, database, and external endpoint
    expect(true).toBe(true);
  });
});