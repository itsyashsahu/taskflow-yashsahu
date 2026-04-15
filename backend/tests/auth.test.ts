import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from '../src/db/client.js';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

describe('Auth API', () => {
  let token: string;
  const testEmail = `test-${Date.now()}@example.com`;

  afterAll(async () => {
    if (token) {
      await sql`DELETE FROM users WHERE email = ${testEmail}`;
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: testEmail,
          password: 'password123',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json() as AuthResponse;
      expect(body.token).toBeDefined();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(testEmail);
    });

    it('should reject duplicate email', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject missing fields', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'password123',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json() as AuthResponse;
      expect(body.token).toBeDefined();
      token = body.token;
    });

    it('should reject invalid password', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongpassword',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(401);
    });
  });
});