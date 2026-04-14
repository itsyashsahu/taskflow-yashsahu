import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from '../src/db/client.js';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

describe('Projects API', () => {
  let token: string;
  let testProjectId: string;
  const testEmail = `projects-${Date.now()}@example.com`;

  beforeAll(async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Projects Test',
        email: testEmail,
        password: 'password123',
      }),
    });
    const body = await res.json() as { token: string };
    token = body.token;
  });

  afterAll(async () => {
    if (testProjectId) {
      try {
        await sql`DELETE FROM tasks WHERE project_id = ${testProjectId}`;
        await sql`DELETE FROM projects WHERE id = ${testProjectId}`;
      } catch {}
    }
    if (testEmail) {
      try {
        await sql`DELETE FROM users WHERE email = ${testEmail}`;
      } catch {}
    }
    await sql.end();
  });

  describe('GET /projects', () => {
    it('should return 401 without auth', async () => {
      const res = await fetch(`${BASE_URL}/projects`);
      expect(res.status).toBe(401);
    });

    it('should return projects with auth', async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      
      const body = await res.json() as { projects: unknown[] };
      expect(body.projects).toBeDefined();
    });
  });

  describe('POST /projects', () => {
    it('should create a project', async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Project',
          description: 'A test project',
        }),
      });
      expect(res.status).toBe(201);
      
      const body = await res.json() as { project: { id: string } };
      expect(body.project).toBeDefined();
      testProjectId = body.project.id;
    });

    it('should reject missing name', async () => {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: 'No name' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return a specific project', async () => {
      const res = await fetch(`${BASE_URL}/projects/${testProjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await fetch(`${BASE_URL}/projects/00000000-0000-0000-0000-000000000999`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });
  });
});