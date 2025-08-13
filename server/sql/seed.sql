
INSERT INTO tarot_cards (name, suit, arcana, upright_meaning, reversed_meaning, image_url)
VALUES
  ('The Fool', NULL, 'Major', 'Beginnings, spontaneity, free spirit', 'Recklessness, fear of unknown', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO tarot_cards (name, suit, arcana, upright_meaning, reversed_meaning, image_url)
VALUES
  ('Ace of Cups', 'Cups', 'Minor', 'New feelings, intuition, love', 'Emotional block, emptiness', NULL)
ON CONFLICT (name) DO NOTHING;