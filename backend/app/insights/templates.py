# app/insights/templates.py
from jinja2 import Environment, select_autoescape

env = Environment(autoescape=select_autoescape(["html", "xml", "md"]))

# compact headline / phrase templates
TEMPLATES = {
    "micro_macro_correlation": """
Player {{ player_handle or player_id }}'s {{ feature_label }} correlates with a {{ effect_pct }}% {{ direction_text }} in {{ outcome_label }}.
Sample size: {{ sample_size }}. Confidence: {{confidence_pct}}%.
""",
    "team_pattern": """
Team {{ team_name }} shows {{ feature_label }} leading into {{ outcome_label }} (effect size: {{ effect_size_label }}).
This suggests {{ short_action }}.
""",
    "generic_alert": """
Pattern: {{ description }} (method={{method}}, n={{sample_size}}). Suggested review: {{suggested_action}}.
"""
}

def render(template_name: str, **context) -> str:
    tpl = env.from_string(TEMPLATES[template_name])
    return tpl.render(**context).strip()


