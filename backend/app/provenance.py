# app/provenance.py
import hashlib
import json
import os
from typing import Dict

def hash_dict(d: Dict) -> str:
    s = json.dumps(d, sort_keys=True, separators=(',',':'))
    return hashlib.sha256(s.encode('utf-8')).hexdigest()

def file_hash(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def make_provenance(model_name: str = None, model_version: str = None, prompt_template: str = None, prompt_text: str = None, extra_config: dict = None) -> dict:
    prov = {
        "model_name": model_name,
        "model_version": model_version,
        "prompt_template": prompt_template,
        "prompt_text": prompt_text,
        "code_version": os.getenv("GIT_COMMIT_SHA"),
        "created_by": os.getenv("USER") or os.getenv("USERNAME"),
        "extra_config_hash": hash_dict(extra_config or {})
    }
    return prov


