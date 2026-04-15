-- migrate:up
ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));

-- migrate:down
ALTER TABLE users DROP COLUMN theme;
