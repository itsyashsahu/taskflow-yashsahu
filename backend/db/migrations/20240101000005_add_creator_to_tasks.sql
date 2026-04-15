-- migrate:up
ALTER TABLE tasks ADD COLUMN creator_id UUID;

UPDATE tasks t
SET creator_id = p.owner_id
FROM projects p
WHERE p.id = t.project_id
  AND t.creator_id IS NULL;

ALTER TABLE tasks
  ALTER COLUMN creator_id SET NOT NULL;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_creator_id_fkey
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_tasks_creator_id ON tasks(creator_id);

-- migrate:down
DROP INDEX IF EXISTS idx_tasks_creator_id;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_creator_id_fkey;
ALTER TABLE tasks DROP COLUMN IF EXISTS creator_id;
