-- Posts and likes for the Explore > For You feed

CREATE TABLE posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  ticker      text,
  content     text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_likes (
  post_id uuid NOT NULL REFERENCES posts ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read all posts"   ON posts FOR SELECT USING (true);
CREATE POLICY "insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "read all likes"  ON post_likes FOR SELECT USING (true);
CREATE POLICY "insert own like" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own like" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Keep likes_count in sync via trigger
CREATE OR REPLACE FUNCTION sync_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSE
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION sync_likes_count();
