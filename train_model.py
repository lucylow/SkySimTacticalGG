# train_model.py
# Train LightGBM binary model predicting label_dead (player died this round)
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
import joblib

FEATURE_CSV = "features.csv"
MODEL_OUT = "lgb_model.pkl"

df = pd.read_csv(FEATURE_CSV)
# features and label
X = df[["n_events","n_shoot","mean_latency","n_ability","late_smoke","n_trades","n_kills","kd_ratio","accuracy","round_total_deaths","round_late_smokes"]].fillna(0)
y = df["label_dead"]

X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

train_data = lgb.Dataset(X_train, label=y_train)
val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

params = {
    "objective": "binary",
    "metric": ["auc","binary_logloss"],
    "boosting": "gbdt",
    "verbosity": -1,
    "seed": 42,
    "num_leaves": 31,
    "learning_rate": 0.05
}

model = lgb.train(params, train_data, valid_sets=[train_data, val_data], num_boost_round=200, early_stopping_rounds=20)

# evaluate
y_pred = model.predict(X_val)
auc = roc_auc_score(y_val, y_pred)
acc = accuracy_score(y_val, (y_pred>0.5).astype(int))
print(f"AUC: {auc:.3f}  Acc: {acc:.3f}")

joblib.dump(model, MODEL_OUT)
print("Saved model to", MODEL_OUT)

