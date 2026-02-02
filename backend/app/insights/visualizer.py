# app/insights/visualizer.py
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

def bar_correlation_plot(feature_values: Dict[str, tuple], outcomes, title="Feature vs Outcome", xlabel="", ylabel=""):
    """
    Generate a simple bar or group plot showing feature buckets vs outcome rate.
    Returns PNG bytes.
    feature_values: mapping bucket->(count, outcome_rate)
    """
    plt.style.use("seaborn-v0_8-darkgrid")
    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=150)
    buckets = list(feature_values.keys())
    counts = [feature_values[b][0] for b in buckets]
    rates = [feature_values[b][1] for b in buckets]
    ax2 = ax.twinx()
    ax.bar(buckets, counts, color="#7C3AED", alpha=0.6)
    ax2.plot(buckets, rates, color="#FBBF24", marker="o")
    ax.set_xlabel(xlabel or "Bucket")
    ax.set_ylabel("Count", color="#7C3AED")
    ax2.set_ylabel("Outcome rate", color="#FBBF24")
    ax.set_title(title)
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png", dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf.read()

def serialize_png_bytes_to_s3_bytestring(png_bytes: bytes) -> str:
    """
    For the demo, return base64 data URI. In production, upload to S3 and return URL.
    """
    b64 = base64.b64encode(png_bytes).decode("ascii")
    return f"data:image/png;base64,{b64}"

def build_evidence_chart_from_df(df: pd.DataFrame, feature: str, outcome: str) -> Optional[str]:
    """
    Build simple bucketized plot: group feature into quartiles and show outcome rate.
    Returns data_url (data:image/png;base64,...)
    """
    # bucketize
    df_clean = df[[feature, outcome]].dropna()
    if df_clean.empty:
        return None
    try:
        df_clean["bucket"] = pd.qcut(df_clean[feature], q=4, duplicates="drop").astype(str)
        grouped = df_clean.groupby("bucket").agg(count=(outcome, "count"), rate=(outcome, "mean")).reset_index()
        feature_values = {row["bucket"]: (int(row["count"]), float(row["rate"])) for _, row in grouped.iterrows()}
        png = bar_correlation_plot(feature_values, None, title=f"{feature} quartiles vs {outcome}", xlabel=feature)
        return serialize_png_bytes_to_s3_bytestring(png)
    except Exception:
        # Fallback: use simple bins if qcut fails
        try:
            df_clean["bucket"] = pd.cut(df_clean[feature], bins=4, duplicates="drop").astype(str)
            grouped = df_clean.groupby("bucket").agg(count=(outcome, "count"), rate=(outcome, "mean")).reset_index()
            feature_values = {row["bucket"]: (int(row["count"]), float(row["rate"])) for _, row in grouped.iterrows()}
            png = bar_correlation_plot(feature_values, None, title=f"{feature} bins vs {outcome}", xlabel=feature)
            return serialize_png_bytes_to_s3_bytestring(png)
        except Exception:
            return None


