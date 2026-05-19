-- Seed the stream_is_live row in stream_games_config if it doesn't already exist.
-- The bot will keep this updated via POST /api/bot/stream-status.
INSERT INTO stream_games_config (game_name, is_open)
VALUES ('stream_is_live', false)
ON CONFLICT (game_name) DO NOTHING;
