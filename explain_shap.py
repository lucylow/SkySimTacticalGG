# explain_shap.py
# Compute SHAP values for a given row and output a textual explanation
import pandas as pd
import joblib
import shap

FEATURE_CSV = "features.csv"
MODEL_OUT = "lgb_model.pkl"

df = pd.read_csv(FEATURE_CSV)
X = df[["n_events","n_shoot","mean_latency","n_ability","late_smoke","n_trades","round_total_deaths","round_late_smokes"]].fillna(0)

model = joblib.load(MODEL_OUT)

# take a random sample row to explain
row_idx = 5
x_row = X.iloc[[row_idx]]

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(x_row)[1]  # for binary classification returns [class0, class1]

# produce a ranked explanation
feature_names = X.columns.tolist()
pairs = list(zip(feature_names, shap_values[0]))
pairs_sorted = sorted(pairs, key=lambda p: abs(p[1]), reverse=True)

print("Top contributing features (to probability of death):")
for fname, s in pairs_sorted[:6]:
    sign = "+" if s>0 else "-"
    print(f" {fname}: {sign}{abs(s):.4f} (SHAP)")

# Generate text block for UI "Why this?"
def generate_reason_text(row, shap_pairs):
    lines = []
    for fname, val in shap_pairs[:4]:
        v = x_row.iloc[0][fname]
        impact = "increases" if val>0 else "decreases"
        lines.append(f"{fname.replace('_',' ')} = {v} ({impact} death probability, effect {abs(val):.3f})")
    return "\n".join(lines)

reason = generate_reason_text(x_row, pairs_sorted)
print("\nExplanation for this sample row:\n", reason)

