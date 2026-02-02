# app/auth.py
from fastapi import Header, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Dict, Any
from pydantic import BaseModel

security = HTTPBearer()

class User(BaseModel):
    username: str
    roles: list

def parse_token(token: str) -> User:
    """
    Lightweight token parser for demo purposes ONLY.

    Expected token formats for this demo:
      - 'reviewer:<username>'  -> gives role 'reviewer'
      - 'user:<username>'      -> regular user

    In production:
      - Replace this with JWT verification (PyJWT / python-jose) or OIDC introspection.
      - Verify signatures, expiry, audience, issuer.
      - Extract roles/groups from claims.
    """
    if not token:
        raise HTTPException(status_code=401, detail="missing token")
    # demo parsing
    try:
        if token.startswith("reviewer:"):
            username = token.split(":", 1)[1]
            return User(username=username, roles=["reviewer"])
        if token.startswith("user:"):
            username = token.split(":", 1)[1]
            return User(username=username, roles=["user"])
    except Exception:
        pass
    raise HTTPException(status_code=401, detail="invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> User:
    """
    Dependency to get the current user from Authorization header.
    """
    token = credentials.credentials
    return parse_token(token)

def require_role(role: str):
    """
    Returns a dependency function that enforces given role.
    Usage in FastAPI endpoint:
      @router.post("/action")
      def action(..., user: User = Depends(require_role("reviewer"))):
          ...
    """
    def dependency(user: User = Security(get_current_user)):
        if role not in user.roles:
            raise HTTPException(status_code=403, detail="forbidden")
        return user
    return dependency


