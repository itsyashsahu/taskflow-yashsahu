-- Password is 'password123' (bcrypt cost 12)
INSERT INTO users (id, name, email, password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com',
   '$2a$12$sFXR1f3c2xUtulnqnJqoFu89IFFandPbdHVVhZGM9PNm9COLsfJC6'),
  ('00000000-0000-0000-0000-000000000002', 'Jane Doe', 'jane@example.com',
  '$2a$12$sFXR1f3c2xUtulnqnJqoFu89IFFandPbdHVVhZGM9PNm9COLsfJC6'),
  ('00000000-0000-0000-0000-000000000003', 'John Smith', 'john@example.com',
  '$2a$12$sFXR1f3c2xUtulnqnJqoFu89IFFandPbdHVVhZGM9PNm9COLsfJC6'),
  ('00000000-0000-0000-0000-000000000004', 'Priya Patel', 'priya@example.com',
  '$2a$12$sFXR1f3c2xUtulnqnJqoFu89IFFandPbdHVVhZGM9PNm9COLsfJC6');

INSERT INTO projects (id, name, description, owner_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Website Redesign',
   'Internal engineering portal featuring new documentation structures.',
  '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000011', 'Mobile App Launch',
  'Release planning, QA, and launch readiness for the mobile app.',
  '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000012', 'Customer Analytics',
  'Build dashboards and event tracking for product analytics.',
  '00000000-0000-0000-0000-000000000003');

INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, due_date) VALUES
  ('Design homepage', 'Create wireframes for the new homepage layout',
   'todo', 'high',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
   CURRENT_DATE + INTERVAL '7 days'),

  ('Set up CI/CD pipeline', 'Configure GitHub Actions for automated deployments',
   'in_progress', 'medium',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000002',
   CURRENT_DATE + INTERVAL '3 days'),

  ('Write API documentation', 'Document all REST endpoints with request/response examples',
   'done', 'low',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '2 days'),

    ('Implement onboarding flow', 'Create first-run onboarding screens and state handling',
    'in_progress', 'high',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE + INTERVAL '5 days'),

    ('QA smoke tests', 'Run smoke tests on iOS and Android test builds',
    'todo', 'medium',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000004',
    CURRENT_DATE + INTERVAL '2 days'),

    ('Prepare launch checklist', 'Finalize release checklist and rollback plan',
    'done', 'low',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE - INTERVAL '1 day'),

    ('Define KPI events', 'Identify and map product events for funnel reporting',
    'todo', 'high',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '6 days'),

    ('Build dashboard queries', 'Create SQL queries for retention and activation metrics',
    'in_progress', 'medium',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE + INTERVAL '4 days'),

    ('Review data quality', 'Validate tracked events for consistency and coverage',
    'done', 'low',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000004',
    CURRENT_DATE - INTERVAL '3 days');