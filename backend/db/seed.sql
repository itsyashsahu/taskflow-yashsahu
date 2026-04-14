-- Password is 'password123' (bcrypt cost 12)
INSERT INTO users (id, name, email, password) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com',
   '$2a$12$7gobl2Dhu4QMj1ZwEBEbce1SjAw4gdUd9Y4AiLElvkABqU7wizI3i'),
  ('00000000-0000-0000-0000-000000000002', 'Jane Doe', 'jane@example.com',
   '$2a$12$7gobl2Dhu4QMj1ZwEBEbce1SjAw4gdUd9Y4AiLElvkABqU7wizI3i');

INSERT INTO projects (id, name, description, owner_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Website Redesign',
   'Internal engineering portal featuring new documentation structures.',
   '00000000-0000-0000-0000-000000000001');

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
   CURRENT_DATE - INTERVAL '2 days');