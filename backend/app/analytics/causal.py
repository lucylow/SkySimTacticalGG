# app/analytics/causal.py
"""
Causal inference module using propensity scoring for stronger claims.
Adjusts for confounding variables to estimate causal effects.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import logging

logger = logging.getLogger("analytics.causal")


def compute_propensity(df, treatment_col, covariates):
    """
    Estimate propensity to receive treatment (e.g., "advance_count >= 1").
    Uses RandomForest to model P(treatment | covariates).
    
    Returns:
        df with added 'propensity' and 'w' (IPW weights) columns
        fitted propensity model
    """
    if treatment_col not in df.columns:
        raise ValueError(f"Treatment column {treatment_col} not in dataframe")
    
    # Create binary treatment indicator
    df = df.copy()
    df["_treatment"] = (df[treatment_col] > 0).astype(int)
    
    # Prepare covariates
    missing_covs = [c for c in covariates if c not in df.columns]
    if missing_covs:
        logger.warning(f"Missing covariates: {missing_covs}, filling with 0")
        for c in missing_covs:
            df[c] = 0
    
    X = df[covariates].fillna(0)
    y = df["_treatment"]
    
    if y.sum() == 0 or y.sum() == len(y):
        logger.warning("Treatment is constant, cannot compute propensity")
        df["propensity"] = 0.5
        df["w"] = 1.0
        return df, None
    
    # Fit propensity model
    try:
        clf = RandomForestClassifier(n_estimators=100, random_state=0, max_depth=5)
        clf.fit(X, y)
        p = clf.predict_proba(X)[:, 1]
        
        # Clip propensity scores to avoid extreme weights
        p = np.clip(p, 0.05, 0.95)
        
        df["propensity"] = p
        
        # Compute IPW weights
        df["w"] = (
            df["_treatment"] / p +
            (1 - df["_treatment"]) / (1 - p)
        )
        
        return df, clf
    except Exception as e:
        logger.exception(f"Error computing propensity: {e}")
        df["propensity"] = 0.5
        df["w"] = 1.0
        return df, None


def weighted_outcome_diff(df, outcome_col, treatment_col, weights_col="w"):
    """
    Compute weighted average treatment effect (ATE) using IPW weights.
    """
    if outcome_col not in df.columns or weights_col not in df.columns:
        raise ValueError("Missing required columns")
    
    df = df.copy()
    df["_treatment"] = (df[treatment_col] > 0).astype(int)
    
    # Weighted means
    treated = df[df["_treatment"] == 1]
    control = df[df["_treatment"] == 0]
    
    if len(treated) == 0 or len(control) == 0:
        return None
    
    mean_treated = (treated[outcome_col] * treated[weights_col]).sum() / treated[weights_col].sum()
    mean_control = (control[outcome_col] * control[weights_col]).sum() / control[weights_col].sum()
    
    ate = mean_treated - mean_control
    
    return {
        "ate": float(ate),
        "mean_treated": float(mean_treated),
        "mean_control": float(mean_control),
        "n_treated": len(treated),
        "n_control": len(control)
    }


def propensity_adjusted_effect(df, treatment_col, outcome_col, covariates):
    """
    Full pipeline: compute propensity, IPW weights, and weighted ATE.
    
    Returns dict with:
        - ate: average treatment effect
        - naive_ate: unadjusted difference
        - propensity_stats: summary of propensity model
    """
    # Naive (unadjusted) effect
    df_treat = df[df[treatment_col] > 0]
    df_control = df[df[treatment_col] == 0]
    
    if len(df_treat) == 0 or len(df_control) == 0:
        return None
    
    naive_ate = df_treat[outcome_col].mean() - df_control[outcome_col].mean()
    
    # Propensity-adjusted effect
    df_weighted, prop_model = compute_propensity(df, treatment_col, covariates)
    weighted_result = weighted_outcome_diff(df_weighted, outcome_col, treatment_col)
    
    if weighted_result is None:
        return None
    
    return {
        "ate": weighted_result["ate"],
        "naive_ate": float(naive_ate),
        "mean_treated": weighted_result["mean_treated"],
        "mean_control": weighted_result["mean_control"],
        "n_treated": weighted_result["n_treated"],
        "n_control": weighted_result["n_control"],
        "propensity_mean": float(df_weighted["propensity"].mean()),
        "propensity_min": float(df_weighted["propensity"].min()),
        "propensity_max": float(df_weighted["propensity"].max()),
        "weight_mean": float(df_weighted["w"].mean()),
        "weight_max": float(df_weighted["w"].max())
    }


