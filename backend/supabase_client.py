import httpx
from config import Config

URL = Config.SUPABASE_URL
ANON = Config.SUPABASE_ANON_KEY
SERVICE = Config.SUPABASE_SERVICE_ROLE_KEY

def _anon_headers():
    return {
        "apikey": ANON,
        "Authorization": f"Bearer {ANON}",
        "Content-Type": "application/json"
    }

def _service_headers(extra=None):
    h = {
        "apikey": SERVICE,
        "Authorization": f"Bearer {SERVICE}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    if extra:
        h.update(extra)
    return h

def _user_headers(token):
    return {
        "apikey": SERVICE,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

# ── Auth ──────────────────────────────────────────────────────

def auth_signup(email, password, name):
    r = httpx.post(
        f"{URL}/auth/v1/signup",
        json={"email": email, "password": password, "data": {"name": name}},
        headers=_anon_headers(),
        timeout=10
    )
    return r.status_code, r.json()

def auth_login(email, password):
    r = httpx.post(
        f"{URL}/auth/v1/token?grant_type=password",
        json={"email": email, "password": password},
        headers=_anon_headers(),
        timeout=10
    )
    return r.status_code, r.json()

def auth_refresh(refresh_token):
    r = httpx.post(
        f"{URL}/auth/v1/token?grant_type=refresh_token",
        json={"refresh_token": refresh_token},
        headers=_anon_headers(),
        timeout=10
    )
    return r.status_code, r.json()

def auth_logout(access_token):
    httpx.post(
        f"{URL}/auth/v1/logout",
        headers={**_anon_headers(), "Authorization": f"Bearer {access_token}"},
        timeout=10
    )

def auth_get_user(access_token):
    r = httpx.get(
        f"{URL}/auth/v1/user",
        headers={**_anon_headers(), "Authorization": f"Bearer {access_token}"},
        timeout=10
    )
    return r.status_code, r.json()

def auth_resend(email):
    r = httpx.post(
        f"{URL}/auth/v1/resend",
        json={"type": "signup", "email": email},
        headers=_anon_headers(),
        timeout=10
    )
    return r.status_code

def auth_delete_user(user_id):
    r = httpx.delete(
        f"{URL}/auth/v1/admin/users/{user_id}",
        headers=_service_headers(),
        timeout=10
    )
    return r.status_code

# ── Database ──────────────────────────────────────────────────

def db_select(table, match=None, order=None, limit=None, joins=None):
    params = {}
    if match:
        for k, v in match.items():
            params[k] = f"eq.{v}"
    if order:
        params["order"] = order
    if limit:
        params["limit"] = limit
    select = joins if joins else "*"
    params["select"] = select
    r = httpx.get(
        f"{URL}/rest/v1/{table}",
        params=params,
        headers={**_service_headers(), "Accept": "application/json"},
        timeout=10
    )
    if r.status_code == 200:
        return r.json()
    return []

def db_select_single(table, match):
    results = db_select(table, match)
    return results[0] if results else None

def db_insert(table, data):
    r = httpx.post(
        f"{URL}/rest/v1/{table}",
        json=data,
        headers=_service_headers(),
        timeout=10
    )
    if r.status_code in (200, 201) and r.text:
        d = r.json()
        return d[0] if isinstance(d, list) else d
    return None

def db_upsert(table, data, on_conflict):
    headers = _service_headers({"Prefer": f"resolution=merge-duplicates,return=representation"})
    r = httpx.post(
        f"{URL}/rest/v1/{table}?on_conflict={on_conflict}",
        json=data,
        headers=headers,
        timeout=10
    )
    if r.status_code in (200, 201) and r.text:
        d = r.json()
        return d[0] if isinstance(d, list) else d
    return None

def db_update(table, data, match):
    params = {k: f"eq.{v}" for k, v in match.items()}
    r = httpx.patch(
        f"{URL}/rest/v1/{table}",
        json=data,
        params=params,
        headers=_service_headers(),
        timeout=10
    )
    if r.status_code in (200, 204) and r.text:
        d = r.json()
        return d[0] if isinstance(d, list) else d
    return data

def db_delete(table, match):
    params = {k: f"eq.{v}" for k, v in match.items()}
    r = httpx.delete(
        f"{URL}/rest/v1/{table}",
        params=params,
        headers=_service_headers(),
        timeout=10
    )
    return r.status_code
