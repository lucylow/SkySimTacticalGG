# app/analytics/jobs.py
"""
Analysis job that runs correlations and persists results to correlation_results table.
Can be run as Celery task or scheduled job.
"""
import asyncio
import json
import logging
import uuid
from app.analytics.aggregate import extract_round_features
from app.analytics.stats import (
    point_biserial, logistic_model, multiple_test_correction, chi2_feature_counts
)
from app.settings import settings
import asyncpg

logger = logging.getLogger("analytics.jobs")


async def run_correlation_job():
    """
    Main correlation analysis job:
    1. Extract round features from database
    2. Run statistical tests (point-biserial, chi2, logistic regression)
    3. Apply multiple testing correction
    4. Persist results to correlation_results table
    """
    logger.info("Starting correlation analysis job")
    
    try:
        pool = await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=3)
        
        # Extract features
        df = await extract_round_features(pool)
        
        if df.empty:
            logger.warning("No data available for correlation analysis")
            await pool.close()
            return {"status": "no_data", "message": "No rounds with micro_actions found"}
        
        logger.info(f"Extracted {len(df)} round-team records for analysis")
        
        results = []
        
        # Continuous features to test with point-biserial correlation
        continuous_features = [
            "advance_count", "hold_count", "plant_count", "engage_count",
            "retreat_count", "rotate_count", "mean_confidence",
            "speed_mean", "approach_mean", "rotation_mean",
            "total_actions", "action_diversity"
        ]
        
        # Test each continuous feature
        for feat in continuous_features:
            if feat not in df.columns:
                continue
            out = point_biserial(df, feat, outcome="round_win")
            if out:
                out["feature_name"] = feat
                out["outcome"] = "round_win"
                out["metric_name"] = "point_biserial"
                results.append(out)
        
        # Categorical/count features with chi-square
        categorical_features = ["advance_count", "plant_count", "engage_count"]
        for feat in categorical_features:
            if feat not in df.columns:
                continue
            out = chi2_feature_counts(df, feat, outcome="round_win", bins=5)
            if out:
                out["feature_name"] = feat
                out["outcome"] = "round_win"
                out["metric_name"] = "chi2"
                results.append(out)
        
        # Apply multiple testing correction
        results = multiple_test_correction(results)
        
        # Store point-biserial and chi2 results
        async with pool.acquire() as conn:
            for r in results:
                result_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO correlation_results (
                        id, metric_name, feature_name, outcome_name, correlation,
                        p_value, p_value_bh, effect_size, direction, method,
                        sample_size, significant, extra
                    )
                    VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                    )
                """,
                    result_id,
                    r.get("metric_name", "point_biserial"),
                    r["feature_name"],
                    r["outcome"],
                    r.get("r") or r.get("chi2"),
                    r.get("p") or r.get("p_value"),
                    r.get("p_bh"),
                    r.get("r") or r.get("chi2"),  # effect_size
                    "pos" if (r.get("r", 0) > 0 or r.get("chi2", 0) > 0) else "neg",
                    r.get("metric_name", "point_biserial"),
                    r["n"],
                    r.get("significant", False),
                    json.dumps(r)
                )
        
        logger.info(f"Stored {len(results)} correlation results")
        
        # Logistic regression example
        model_features = [
            "advance_count", "plant_count", "mean_confidence", "speed_mean",
            "total_actions", "action_diversity"
        ]
        # Filter to features that exist in dataframe
        model_features = [f for f in model_features if f in df.columns]
        
        if model_features and "round_win" in df.columns:
            model_res = logistic_model(df, model_features, outcome="round_win")
            
            if model_res:
                logger.info(f"Logistic model fitted with {model_res['n_obs']} observations")
                
                # Apply correction to model results
                model_results = multiple_test_correction(model_res["summary"])
                
                async with pool.acquire() as conn:
                    for item in model_results:
                        result_id = str(uuid.uuid4())
                        await conn.execute("""
                            INSERT INTO correlation_results (
                                id, metric_name, feature_name, outcome_name, correlation,
                                p_value, p_value_bh, effect_size, direction, method,
                                sample_size, significant, extra
                            )
                            VALUES (
                                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                            )
                        """,
                            result_id,
                            "logistic",
                            item["feature"],
                            "round_win",
                            item["coef"],
                            item["p_value"],
                            item.get("p_bh", item["p_value"]),
                            item["odds_ratio"],
                            "pos" if item["coef"] > 0 else "neg",
                            "logistic",
                            model_res["n_obs"],
                            item.get("significant", False),
                            json.dumps(item)
                        )
        
        await pool.close()
        
        logger.info("Correlation analysis job completed successfully")
        return {
            "status": "success",
            "n_results": len(results),
            "n_rounds": len(df)
        }
        
    except Exception as e:
        logger.exception(f"Error in correlation analysis job: {e}")
        return {"status": "error", "error": str(e)}


# Celery task wrapper (if using Celery)
def run_correlation_job_task():
    """Celery task wrapper for run_correlation_job."""
    return asyncio.run(run_correlation_job())

