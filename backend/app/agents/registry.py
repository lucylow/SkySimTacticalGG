# app/agents/registry.py
from typing import Dict, Callable
import importlib
import yaml
from pathlib import Path

_REGISTRY = {}

def register_agent(agent_cls):
    _REGISTRY[agent_cls.name] = agent_cls
    return agent_cls

def get_agent(name: str):
    cls = _REGISTRY.get(name)
    if cls is None:
        raise KeyError(f"Unknown agent: {name}")
    return cls

def load_config(path=None):
    if path is None:
        # Try to find config relative to backend directory
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        path = os.path.join(base_dir, "config", "agents.yaml")
    p = Path(path)
    if not p.exists():
        return {}
    with p.open() as f:
        return yaml.safe_load(f)

def auto_import_agents(module_prefix="app.agents"):
    """
    Import all python files under app/agents to ensure registration decorators run.
    """
    import pkgutil
    import app.agents as agents_pkg
    for _, modname, _ in pkgutil.iter_modules(agents_pkg.__path__):
        importlib.import_module(f"{module_prefix}.{modname}")

