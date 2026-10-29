# Findora release checklist

- [ ] Configure a unique high-entropy JWT secret through deployment secret manager.
- [ ] Configure and test real email verification/password-reset delivery; verify bounce, retry, abuse, and provider outage handling.
- [ ] Wire React register/login/verification/reset flows to the auth API; store bearer tokens safely and add sign-out/expiry handling. Prefer secure HttpOnly cookies with CSRF protection for browser production deployments.
- [ ] Wire reporting/claim forms to authenticated state and show verification-required errors accessibly.
- [ ] Replace process-local rate limits with a shared store for multi-instance deployments; add dedicated OTP/request throttles and abuse controls.
- [ ] Configure SMS provider if needed; implement in-app notifications and user notification preferences.
- [ ] Implement secure image upload to private object storage, content-type/size checks, image re-encoding, malware scanning, and signed URLs. Do not accept arbitrary external image URLs as trusted storage.
- [ ] Complete location hierarchy UI and validate `locationId` against active catalogue entries; keep free-text fallback for offline/manual operation.
- [ ] Add MongoDB indexes/migrations and verify transaction or atomicity behavior for concurrent claims/handover. Current state updates are not multi-document transactions.
- [ ] Add integration/e2e tests against disposable MongoDB for registration, OTP expiry, password reset, auth/RBAC, competing claims, rejection recovery, approval/handover, pagination, and privacy redaction.
- [ ] Set HTTPS, strict CORS, secure proxy settings, MongoDB TLS/auth, backups/restore drills, logs/alerts, retention policies, and privacy/legal notices.
- [ ] Perform dependency audit (`npm audit`), secret scan, accessibility QA, and penetration test.
- [ ] Run `npm ci && npm run build && npm test` in the target deployment runtime and verify health after deployment.

## Integration adapters

`EMAIL_PROVIDER_URL` and `EMAIL_PROVIDER_TOKEN` are documented configuration placeholders only. A concrete provider-specific adapter still needs implementation and tests. The current app deliberately does not pretend that emails or SMS messages were delivered. Map/geocoding, university SSO, and image storage likewise remain explicit future adapters.
