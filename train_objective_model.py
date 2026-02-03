import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import shap
import joblib

def train_objective_model(data_path):
    # Load dataset
    df = pd.read_csv(data_path)
    
    # Feature candidates from the document
    features = [
        'team_gold_diff', 'ally_count_near', 'enemy_count_near',
        'ally_avg_hp_percent', 'enemy_avg_hp_percent',
        'sum_ultimates_up_team', 'sum_ultimates_up_enemy',
        'smite_available', 'enemy_smite_available',
        'control_wards_team', 'control_wards_enemy',
        'time_until_next_objective'
    ]
    
    X = df[features]
    y = df['success_objective'] # Target: 1 if objective secured, 0 otherwise
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # LightGBM parameters from the document
    params = {
        'objective': 'binary',
        'metric': 'auc',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.05,
        'feature_fraction': 0.9,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': -1
    }
    
    train_data = lgb.Dataset(X_train, label=y_train)
    test_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
    
    model = lgb.train(
        params,
        train_data,
        num_boost_round=1000,
        valid_sets=[test_data],
        callbacks=[lgb.early_stopping(stopping_rounds=100)]
    )
    
    # Save model
    joblib.dump(model, 'objective_success_model.pkl')
    
    # SHAP analysis
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)
    
    print(f"Model trained. AUC: {roc_auc_score(y_test, model.predict(X_test))}")
    return model, shap_values

if __name__ == "__main__":
    # Example usage with mock data path
    # train_objective_model('objective_data.csv')
    print("Objective model training script ready.")
