-- Seed the stream_is_live key in stream_games_config if it doesn't already exist.
-- The bot will keep this updated via POST /api/bot/stream-status.
INSERT INTO stream_games_config (key, value)
VALUES ('stream_is_live', 'false')
ON CONFLICT (key) DO NOTHING;
