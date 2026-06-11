-- Prode Conquer 2026 - Supabase Database Setup Migration
-- Copy and paste this script directly into the Supabase SQL Editor.

-- 1. DROP EXISTING TABLES IF THEY EXIST (FOR RESETTING)
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE TABLES
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT 'conquer2026',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  score INTEGER NOT NULL DEFAULT 0,
  exact_count INTEGER NOT NULL DEFAULT 0,
  outcome_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE matches (
  id INTEGER PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  group_name TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  stage TEXT NOT NULL,
  home_score INTEGER DEFAULT NULL,
  away_score INTEGER DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE -- MANUAL LOCKING FEATURE
);

CREATE TABLE predictions (
  id TEXT PRIMARY KEY, -- 'user_id_match_id'
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL,
  predicted_away_score INTEGER NOT NULL,
  points_earned INTEGER DEFAULT NULL
);

-- 3. INSERT USERS
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (1, 'ariel', 'Ariel', 'conquer2026', true);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (2, 'agostina', 'Agostina', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (3, 'jazmin', 'Jazmín', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (4, 'ariana', 'Ariana', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (5, 'cande', 'Cande', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (6, 'cris', 'Cris', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (7, 'tomi', 'Tomi', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (8, 'lucas', 'Lucas', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (9, 'manu', 'Manu', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (10, 'nina', 'Nina', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (11, 'juli', 'Juli', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (12, 'jaz_mercado', 'Jaz Mercado', 'conquer2026', false);
INSERT INTO users (id, username, display_name, password, is_admin) VALUES (13, 'fabri', 'Fabri', 'conquer2026', false);

-- 4. INSERT MATCHES (104 matches total)
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (1, 'México', 'Sudáfrica', 'A', '2026-06-11T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (2, 'Corea del Sur', 'Chequia', 'A', '2026-06-11T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (3, 'México', 'Corea del Sur', 'A', '2026-06-16T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (4, 'Sudáfrica', 'Chequia', 'A', '2026-06-16T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (5, 'Chequia', 'México', 'A', '2026-06-21T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (6, 'Sudáfrica', 'Corea del Sur', 'A', '2026-06-21T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (7, 'Canadá', 'Bosnia y Herzegovina', 'B', '2026-06-11T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (8, 'Qatar', 'Suiza', 'B', '2026-06-11T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (9, 'Canadá', 'Qatar', 'B', '2026-06-16T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (10, 'Bosnia y Herzegovina', 'Suiza', 'B', '2026-06-16T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (11, 'Suiza', 'Canadá', 'B', '2026-06-21T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (12, 'Bosnia y Herzegovina', 'Qatar', 'B', '2026-06-21T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (13, 'Brasil', 'Marruecos', 'C', '2026-06-11T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (14, 'Haití', 'Escocia', 'C', '2026-06-11T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (15, 'Brasil', 'Haití', 'C', '2026-06-16T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (16, 'Marruecos', 'Escocia', 'C', '2026-06-16T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (17, 'Escocia', 'Brasil', 'C', '2026-06-21T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (18, 'Marruecos', 'Haití', 'C', '2026-06-21T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (19, 'Estados Unidos', 'Paraguay', 'D', '2026-06-12T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (20, 'Australia', 'Turquía', 'D', '2026-06-12T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (21, 'Estados Unidos', 'Australia', 'D', '2026-06-17T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (22, 'Paraguay', 'Turquía', 'D', '2026-06-17T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (23, 'Turquía', 'Estados Unidos', 'D', '2026-06-22T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (24, 'Paraguay', 'Australia', 'D', '2026-06-22T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (25, 'Alemania', 'Curazao', 'E', '2026-06-12T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (26, 'Costa de Marfil', 'Ecuador', 'E', '2026-06-12T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (27, 'Alemania', 'Costa de Marfil', 'E', '2026-06-17T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (28, 'Curazao', 'Ecuador', 'E', '2026-06-17T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (29, 'Ecuador', 'Alemania', 'E', '2026-06-22T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (30, 'Curazao', 'Costa de Marfil', 'E', '2026-06-22T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (31, 'Francia', 'Japón', 'F', '2026-06-12T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (32, 'Suecia', 'Túnez', 'F', '2026-06-12T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (33, 'Francia', 'Suecia', 'F', '2026-06-17T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (34, 'Japón', 'Túnez', 'F', '2026-06-17T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (35, 'Túnez', 'Francia', 'F', '2026-06-22T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (36, 'Japón', 'Suecia', 'F', '2026-06-22T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (37, 'Argentina', 'Irán', 'G', '2026-06-13T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (38, 'Chile', 'Polonia', 'G', '2026-06-13T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (39, 'Argentina', 'Chile', 'G', '2026-06-18T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (40, 'Irán', 'Polonia', 'G', '2026-06-18T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (41, 'Polonia', 'Argentina', 'G', '2026-06-23T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (42, 'Irán', 'Chile', 'G', '2026-06-23T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (43, 'España', 'Argelia', 'H', '2026-06-13T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (44, 'Perú', 'Ucrania', 'H', '2026-06-13T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (45, 'España', 'Perú', 'H', '2026-06-18T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (46, 'Argelia', 'Ucrania', 'H', '2026-06-18T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (47, 'Ucrania', 'España', 'H', '2026-06-23T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (48, 'Argelia', 'Perú', 'H', '2026-06-23T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (49, 'Portugal', 'Egipto', 'I', '2026-06-13T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (50, 'Nueva Zelanda', 'Rumania', 'I', '2026-06-13T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (51, 'Portugal', 'Nueva Zelanda', 'I', '2026-06-18T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (52, 'Egipto', 'Rumania', 'I', '2026-06-18T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (53, 'Rumania', 'Portugal', 'I', '2026-06-23T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (54, 'Egipto', 'Nueva Zelanda', 'I', '2026-06-23T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (55, 'Italia', 'Camerún', 'J', '2026-06-14T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (56, 'Venezuela', 'Arabia Saudita', 'J', '2026-06-14T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (57, 'Italia', 'Venezuela', 'J', '2026-06-19T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (58, 'Camerún', 'Arabia Saudita', 'J', '2026-06-19T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (59, 'Arabia Saudita', 'Italia', 'J', '2026-06-24T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (60, 'Camerún', 'Venezuela', 'J', '2026-06-24T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (61, 'Bélgica', 'Senegal', 'K', '2026-06-14T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (62, 'Costa Rica', 'Noruega', 'K', '2026-06-14T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (63, 'Bélgica', 'Costa Rica', 'K', '2026-06-19T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (64, 'Senegal', 'Noruega', 'K', '2026-06-19T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (65, 'Noruega', 'Bélgica', 'K', '2026-06-24T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (66, 'Senegal', 'Costa Rica', 'K', '2026-06-24T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (67, 'Inglaterra', 'Croacia', 'L', '2026-06-14T14:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (68, 'Ghana', 'Panamá', 'L', '2026-06-14T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (69, 'Inglaterra', 'Ghana', 'L', '2026-06-19T17:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (70, 'Croacia', 'Panamá', 'L', '2026-06-19T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (71, 'Panamá', 'Inglaterra', 'L', '2026-06-24T20:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (72, 'Croacia', 'Ghana', 'L', '2026-06-24T23:00:00-03:00', 'group');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (73, '1° Grupo A', '2° Grupo B', NULL, '2026-06-28T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (74, '1° Grupo C', '2° Grupo D', NULL, '2026-06-28T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (75, '1° Grupo E', '2° Grupo F', NULL, '2026-06-29T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (76, '1° Grupo G', '2° Grupo H', NULL, '2026-06-29T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (77, '1° Grupo I', '2° Grupo J', NULL, '2026-06-30T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (78, '1° Grupo K', '2° Grupo L', NULL, '2026-06-30T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (79, '1° Grupo B', '2° Grupo A', NULL, '2026-07-01T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (80, '1° Grupo D', '2° Grupo C', NULL, '2026-07-01T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (81, '1° Grupo F', '2° Grupo E', NULL, '2026-07-02T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (82, '1° Grupo H', '2° Grupo G', NULL, '2026-07-02T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (83, '1° Grupo J', '2° Grupo I', NULL, '2026-07-03T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (84, '1° Grupo L', '2° Grupo K', NULL, '2026-07-03T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (85, 'Mejor 3° (A/B/C)', '1° Grupo I', NULL, '2026-07-04T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (86, 'Mejor 3° (D/E/F)', '1° Grupo J', NULL, '2026-07-04T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (87, 'Mejor 3° (G/H/I)', '1° Grupo K', NULL, '2026-07-05T14:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (88, 'Mejor 3° (J/K/L)', '1° Grupo L', NULL, '2026-07-05T18:00:00-03:00', 'r32');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (89, 'Ganador R32-1', 'Ganador R32-2', NULL, '2026-07-05T14:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (90, 'Ganador R32-3', 'Ganador R32-4', NULL, '2026-07-05T18:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (91, 'Ganador R32-5', 'Ganador R32-6', NULL, '2026-07-06T14:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (92, 'Ganador R32-7', 'Ganador R32-8', NULL, '2026-07-06T18:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (93, 'Ganador R32-9', 'Ganador R32-10', NULL, '2026-07-07T14:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (94, 'Ganador R32-11', 'Ganador R32-12', NULL, '2026-07-07T18:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (95, 'Ganador R32-13', 'Ganador R32-14', NULL, '2026-07-08T14:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (96, 'Ganador R32-15', 'Ganador R32-16', NULL, '2026-07-08T18:00:00-03:00', 'r16');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (97, 'Ganador R16-1', 'Ganador R16-2', NULL, '2026-07-10T15:00:00-03:00', 'quarter');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (98, 'Ganador R16-3', 'Ganador R16-4', NULL, '2026-07-10T19:00:00-03:00', 'quarter');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (99, 'Ganador R16-5', 'Ganador R16-6', NULL, '2026-07-11T15:00:00-03:00', 'quarter');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (100, 'Ganador R16-7', 'Ganador R16-8', NULL, '2026-07-11T19:00:00-03:00', 'quarter');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (101, 'Ganador Cuartos-1', 'Ganador Cuartos-2', NULL, '2026-07-14T17:00:00-03:00', 'semi');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (102, 'Ganador Cuartos-3', 'Ganador Cuartos-4', NULL, '2026-07-15T17:00:00-03:00', 'semi');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (103, 'Perdedor Semifinal 1', 'Perdedor Semifinal 2', NULL, '2026-07-18T17:00:00-03:00', 'third');
INSERT INTO matches (id, home_team, away_team, group_name, match_date, stage) VALUES (104, 'Ganador Semifinal 1', 'Ganador Semifinal 2', NULL, '2026-07-19T17:00:00-03:00', 'final');

-- 5. SYNC SERIAL SEQUENCES
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
