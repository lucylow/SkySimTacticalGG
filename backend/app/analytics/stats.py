# app/analytics/stats.py
"""
Statistical correlation and hypothesis testing for macro-strategy correlation.
Computes point-biserial correlation, chi-square, logistic regression, and multiple testing correction.
"""
import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.api as sm
from statsmodels.formula.api import logit
from statsmodels.stats.multitest import multipletests


def point_biserial(df, feature, outcome="round_win"):
    """
    Point-biserial correlation for continuous feature vs binary outcome.
    Returns dict with r, p, n.
    """
    clean = df[[feature, outcome]].dropna()
    if clean.empty or len(clean) < 3:
        return None
    
    # Ensure outcome is binary
    clean_outcome = clean[outcome].astype(int)
    clean_feature = clean[feature]
    
    try:
        r, p = stats.pointbiserialr(clean_feature, clean_outcome)
        return {
            "feature": feature,
            "r": float(r) if not np.isnan(r) else 0.0,
            "p": float(p) if not np.isnan(p) else 1.0,
            "n": len(clean)
        }
    except Exception as e:
        return None


def chi2_feature_counts(df, cat_feature, outcome="round_win", bins=None):
    """
    Bucketize numeric or use categorical counts, run chi-square test.
    """
    if df.empty:
        return None
    
    clean = df[[cat_feature, outcome]].dropna()
    if clean.empty or len(clean) < 3:
        return None
    
    # Bucketize if numeric
    if pd.api.types.is_numeric_dtype(clean[cat_feature]):
        if bins is None:
            bins = 5
        clean[cat_feature] = pd.cut(clean[cat_feature], bins=bins, labels=False)
    
    # Create contingency table
    try:
        contingency = pd.crosstab(clean[cat_feature], clean[outcome].astype(int))
        if contingency.shape[0] < 2 or contingency.shape[1] < 2:
            return None
        
        chi2, p, dof, ex = stats.chi2_contingency(contingency)
        return {
            "feature": cat_feature,
            "chi2": float(chi2) if not np.isnan(chi2) else 0.0,
            "p": float(p) if not np.isnan(p) else 1.0,
            "dof": int(dof),
            "n": len(clean)
        }
    except Exception:
        return None


def logistic_model(df, features, outcome="round_win"):
    """
    Fit logistic regression and return coefficients, p-values, odds ratios.
    """
    # Drop rows with missing values in features or outcome
    dfc = df.dropna(subset=[outcome] + features)
    if dfc.empty or len(dfc) < 10:
        return None
    
    X = dfc[features].fillna(0)  # Fill any remaining NaN with 0
    X = sm.add_constant(X)
    y = dfc[outcome].astype(int)
    
    try:
        model = sm.Logit(y, X).fit(disp=False, maxiter=100)
        
        params = model.params.to_dict()
        pvalues = model.pvalues.to_dict()
        conf = model.conf_int().to_dict()
        odds = {k: np.exp(v) for k, v in params.items()}
        
        # Assemble results
        res = []
        for f in params:
            if f == "const":
                continue
            res.append({
                "feature": f,
                "coef": float(params[f]) if not np.isnan(params[f]) else 0.0,
                "p_value": float(pvalues[f]) if not np.isnan(pvalues[f]) else 1.0,
                "odds_ratio": float(odds[f]) if not np.isnan(odds[f]) else 1.0,
                "ci_lower": float(conf[f][0]) if not np.isnan(conf[f][0]) else 0.0,
                "ci_upper": float(conf[f][1]) if not np.isnan(conf[f][1]) else 0.0
            })
        
        return {
            "summary": res,
            "llr_pvalue": float(model.llr_pvalue) if not np.isnan(model.llr_pvalue) else 1.0,
            "n_obs": int(model.nobs)
        }
    except Exception as e:
        return None


def multiple_test_correction(results):
    """
    Apply Benjamini-Hochberg multiple testing correction.
    results = list of dicts with 'p' or 'p_value' key.
    Adds p_bh and significant flags.
    """
    if not results:
        return results
    
    # Extract p-values
    pvals = []
    for r in results:
        p = r.get("p") or r.get("p_value")
        if p is not None:
            pvals.append(p)
        else:
            pvals.append(1.0)
    
    if not pvals:
        return results
    
    # Apply BH correction
    try:
        rejected, pvals_corrected, _, _ = multipletests(
            pvals, alpha=0.05, method='fdr_bh'
        )
        
        for i, r in enumerate(results):
            r["p_bh"] = float(pvals_corrected[i]) if i < len(pvals_corrected) else 1.0
            r["significant"] = bool(rejected[i]) if i < len(rejected) else False
        
        return results
    except Exception:
        # If correction fails, mark all as not significant
        for r in results:
            r["p_bh"] = r.get("p") or r.get("p_value") or 1.0
            r["significant"] = False
        return results


