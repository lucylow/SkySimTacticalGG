-- Migration to add a function to fetch unprocessed matches for summary computation
-- This replaces the client-side 'NOT IN' logic which is inefficient and limited.

CREATE OR REPLACE FUNCTION get_unprocessed_grid_matches(batch_limit int DEFAULT 50)
RETURNS TABLE (id uuid) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT gm.id
    FROM grid_matches gm
    WHERE NOT EXISTS (
        SELECT 1 
        FROM grid_ingest_audit gia 
        WHERE gia.provider_resource_id = gm.id::text 
          AND gia.action = 'summary_compute' 
          AND gia.status = 'success'
    )
    ORDER BY gm.match_ts DESC
    LIMIT batch_limit;
END;
$$;
