[OPEN] auth-login-timeout

## Symptom
- `POST /api/v1/auth/login` returns `504 Gateway Time-out` through VPS nginx.
- `GET /api/v1` returns `200 OK`.
- `api-gateway` logs show `POST /api/v1/auth/login - - ms - -`.
- `auth-service` logs do not show the login request reaching the service.

## Current Evidence
- VPS root gateway route works.
- Containers are healthy in `docker compose ps`.
- `.env` service URLs were previously malformed and were corrected.
- After recreate, timeout still persists.
- Direct `api-gateway -> auth-service` health request works.
- Direct `api-gateway -> auth-service` login request works and returns `200 OK`.
- Gateway path through nginx still returns `504 Gateway Time-out`.
- `api-gateway` morgan log still shows `POST /api/v1/auth/login - - ms - -`.

## Hypotheses
1. `api-gateway` is still running old code and the deployed container does not include the latest normalization/failure handling changes.
2. The request to `http://127.0.0.1:8080/api/v1/auth/login` hangs inside `api-gateway` itself, independent of nginx.
3. The proxy middleware is mishandling the mounted auth path at runtime even though direct upstream login works.
4. The active env values inside `api-gateway` still contain malformed quoting/spaces and are not truly normalized in the running process.
5. nginx is serving the current gateway, but the gateway route is blocked/hanging before proxy hooks complete.

## Next Evidence To Collect
- Verify deployed `api-gateway` container contains the latest compiled fix.
- Test direct HTTP to `127.0.0.1:8080/api/v1/auth/login` from inside `api-gateway`.
- Inspect raw `.env` lines on VPS to rule out formatting artifacts.
