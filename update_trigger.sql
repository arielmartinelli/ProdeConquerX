-- SQL script to correct the prediction lock trigger and add the stadium_id column in Supabase.
-- Copy and paste this script directly into the Supabase SQL Editor and click 'Run'.

-- 1. Add stadium_id column to matches table if it doesn't exist
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stadium_id INTEGER;

-- 2. Create the function that validates the rules before saving a prediction
CREATE OR REPLACE FUNCTION verify_prediction_lock() 
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    match_kickoff TIMESTAMPTZ;
    match_is_locked BOOLEAN;
    match_status TEXT;
    existing_pred RECORD;
BEGIN
    -- 1. Check if the prediction already exists (handles upsert / INSERT ON CONFLICT)
    SELECT * INTO existing_pred FROM predictions WHERE id = NEW.id;
    
    IF FOUND THEN
        -- If the predicted scores are not changing, allow it (e.g., updating points_earned)
        IF existing_pred.predicted_home_score = NEW.predicted_home_score AND 
           existing_pred.predicted_away_score = NEW.predicted_away_score THEN
            RETURN NEW;
        END IF;
    END IF;

    -- 2. If it's a standard UPDATE, check if scores are changing
    IF TG_OP = 'UPDATE' THEN
        IF OLD.predicted_home_score = NEW.predicted_home_score AND 
           OLD.predicted_away_score = NEW.predicted_away_score THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Obtener la hora del partido, estado y si está bloqueado manualmente
    SELECT match_date, is_locked, status INTO match_kickoff, match_is_locked, match_status
    FROM matches 
    WHERE id = NEW.match_id;
    
    -- A. Validar que el partido no haya finalizado
    IF match_status = 'finished' THEN
        RAISE EXCEPTION 'El partido ya ha finalizado. No se pueden recibir más pronósticos.';
    END IF;
    
    -- B. Validar si el partido fue bloqueado manualmente por Ariel
    IF match_is_locked = TRUE THEN
        RAISE EXCEPTION 'Votación bloqueada por el Administrador.';
    END IF;

    -- C. Validar el límite de 1 hora antes del partido (Cierre de apuestas)
    IF NOW() >= (match_kickoff - INTERVAL '1 hour') THEN
        RAISE EXCEPTION 'La votación está cerrada. Límite: 1 hora antes del inicio del partido.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger
DROP TRIGGER IF EXISTS trg_verify_prediction_lock ON predictions;
CREATE TRIGGER trg_verify_prediction_lock
BEFORE INSERT OR UPDATE ON predictions
FOR EACH ROW
EXECUTE FUNCTION verify_prediction_lock();

-- 4. Notify Postgrest cache
NOTIFY pgrst, 'reload schema';
