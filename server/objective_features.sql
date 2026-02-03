-- SQL snippets for real-time objective feature extraction
-- To be used with PostgreSQL + TimescaleDB

-- A. Team counts near pit (within 2000 units)
-- Parameters: :match_id, :T (timestamp), :PIT_X, :PIT_Y
CREATE OR REPLACE FUNCTION get_team_counts_near_pit(match_id_param UUID, T_param NUMERIC, PIT_X_param NUMERIC, PIT_Y_param NUMERIC)
RETURNS TABLE(blue_count INT, red_count INT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE p.team = 'blue')::INT as blue_count,
        COUNT(*) FILTER (WHERE p.team = 'red')::INT as red_count
    FROM frames f
    JOIN grid_players p ON f.player_id = p.id
    WHERE f.match_id = match_id_param
    AND f.tick_time BETWEEN T_param - 1 AND T_param + 1
    AND sqrt(power(f.x - PIT_X_param, 2) + power(f.y - PIT_Y_param, 2)) < 2000;
END;
$$ LANGUAGE plpgsql;

-- B. Ultimates up count
CREATE OR REPLACE FUNCTION get_ultimates_up_count(match_id_param UUID, T_param NUMERIC, team_param TEXT)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT SUM(CASE WHEN (payload->>'ultimate_ready')::boolean = true THEN 1 ELSE 0 END)::INT
        FROM grid_events e
        WHERE e.match_id = match_id_param
        AND e.timestamp BETWEEN T_param - 5 AND T_param + 1
        AND e.event_type = 'ultimate_status' 
        AND e.team = team_param
    );
END;
$$ LANGUAGE plpgsql;

-- C. Vision count in pit (wards placed in last 2 minutes)
CREATE OR REPLACE FUNCTION get_vision_count_in_pit(match_id_param UUID, T_param NUMERIC, PIT_X_param NUMERIC, PIT_Y_param NUMERIC, team_param TEXT)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INT
        FROM grid_events e
        WHERE e.match_id = match_id_param
        AND e.event_type IN ('ward_placed', 'control_ward_placed')
        AND (e.payload->>'x')::numeric BETWEEN PIT_X_param - 2000 AND PIT_X_param + 2000
        AND (e.payload->>'y')::numeric BETWEEN PIT_Y_param - 2000 AND PIT_Y_param + 2000
        AND e.timestamp BETWEEN T_param - 120 AND T_param
        AND e.team = team_param
    );
END;
$$ LANGUAGE plpgsql;
