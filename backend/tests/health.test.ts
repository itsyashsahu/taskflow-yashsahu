import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

describe('Health API', () => {
  describe('GET /health', () => {
    it('should return ok status', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body.status).toBe('ok');
    });
  });
});