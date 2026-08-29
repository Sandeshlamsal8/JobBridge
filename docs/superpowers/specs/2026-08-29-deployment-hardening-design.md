# JobBridge Deployment Hardening Design

**Date:** 2026-08-29
**Status:** Approved scope, implementation pending

## Context

JobBridge is a React/Vite frontend backed by Express, MongoDB, Redis, email delivery, file uploads, messaging, and AI-assisted CV processing. The committed environment files have already been removed from reachable Git history. This design addresses the remaining blockers that could expose credentials or user data, permit abuse, or make a production deployment fail unpredictably.

External credentials that appeared in Git history must still be revoked and replaced at their providers. Code changes cannot make an exposed credential secret again.

## Goals

- Stop storing plaintext passwords, verification PINs, and reset tokens.
- Invalidate existing sessions after a password reset or password change.
- Apply effective Redis-backed limits to authentication and upload/message abuse paths.
- Remove hardcoded administrator credentials and mass assignment of protected job fields.
- Fail production startup when required security configuration is missing or malformed.
- Restrict cross-origin access and remove frontend dependencies on localhost URLs.
- Validate uploaded document content and require malware scanning before CV parsing in production.
- Preserve current user workflows and keep the deployment model suitable for one application instance.
- Add focused automated checks for each security boundary changed by this work.

## Non-Goals

- Replacing bearer JWT authentication with refresh tokens or HttpOnly cookies.
- Building a durable worker queue for email, AI processing, or file scanning.
- Moving uploads to object storage.
- Adding horizontal-scaling infrastructure, real-time messaging, or a new observability platform.
- Expanding product functionality unrelated to deployment readiness.

## Configuration And Startup

The backend will validate configuration once, before connecting services or accepting traffic. A small `backend/config/env.js` module will parse environment variables, return normalized values, and throw errors that name invalid variable keys without logging their values.

Production requires:

- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET` with at least 32 characters
- `MESSAGE_ENCRYPTION_KEY` as exactly 64 hexadecimal characters
- `FRONTEND_URL` as an absolute `https:` URL, except explicitly permitted local development
- `CORS_ORIGINS` as a comma-separated list of absolute origins; it may default to `FRONTEND_URL`
- `REDIS_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`
- `CLAMAV_HOST`, `CLAMAV_PORT`, `CLAMAV_TIMEOUT`, and `CLAMAV_REQUIRED=true`

Optional settings receive explicit safe defaults only where a default is harmless. Production must not silently use localhost URLs, placeholder secrets, development CORS rules, or a disabled malware scanner. `TRUST_PROXY` will be parsed as a boolean or hop count and applied to Express so IP-based rate limits work behind the selected hosting proxy.

Server startup order will be: validate configuration, connect MongoDB, initialize Redis, verify required scanner availability, then call `listen`. A failed required dependency prevents startup. Shutdown handlers close the HTTP server, MongoDB, and Redis connections.

Development and test environments may run without Redis or ClamAV only when their requirement flags are explicitly disabled. Redis rate limiting may use the existing in-memory fallback outside production; this is intentionally single-process and must be replaced before running multiple application instances.

## Registration And Email Verification

Registration will never place a plaintext password inside `EmailVerification`.

1. Normalize and validate the submitted email.
2. Reject registration when a verified user already owns the email.
3. Create or update an unverified `User` through the model's normal `save` path so its existing bcrypt password hook runs.
4. Generate a short-lived numeric PIN, bcrypt-hash it, and store only the hash in `EmailVerification` with `userId`, normalized email, expiry, and failed-attempt count.
5. Send the plaintext PIN only in email and do not log it.
6. On verification, compare the submitted PIN with bcrypt, enforce the attempt ceiling and expiry, mark the user verified, and delete the challenge.

An unverified user may restart signup with corrected details; the existing unverified record and challenge are replaced. Resending rotates the PIN hash instead of extending or reusing the old PIN. Login continues to reject unverified accounts.

Existing verification documents containing `userData` or plaintext `pin` are incompatible and will be deleted before deployment. They are short-lived challenges, so users affected by the cleanup can restart registration.

## Password Reset And Session Invalidation

Password-reset documents will store `tokenHash`, produced with Node's built-in SHA-256 implementation, instead of the bearer token. The plaintext random token appears only in the emailed reset link. Reset requests hash the presented token before querying MongoDB, enforce expiry and single use, and delete the reset record after success.

`User` gains `tokenVersion` with a default of `0`. Every signed JWT includes the current version. Authentication middleware compares the token version with the user's current value. Password reset and authenticated password change increment `tokenVersion`, invalidating all previously issued JWTs. Existing users need no data migration because a missing value is treated as `0`.

The existing client-side logout behavior remains. A refresh-token and cookie redesign is outside this hardening pass.

Existing password-reset documents containing plaintext `token` will be deleted before deployment. Users can request a new reset link.

## Rate Limiting

The existing Redis connection and rate-limiter code will be initialized and reused. The middleware will use a small Redis Lua script that increments the fixed-window counter and sets its expiry only when the counter is created, keeping those actions atomic. It will return `429` with `Retry-After` when the limit is exceeded. Keys will combine the operation with IP address and normalized email or authenticated user ID where applicable, without storing raw bearer tokens.

Initial limits are:

| Operation | Limit |
| --- | --- |
| Signup | 5 per IP/email per 15 minutes |
| Login | 10 per IP/email per 15 minutes |
| Verify PIN | 10 per IP/email per 15 minutes |
| Resend verification | 3 per IP/email per hour |
| Forgot/reset password | 5 per IP/email per hour |

The existing message and attachment limits will be wired to initialized Redis and checked before accepting work. When Redis is unavailable in production, guarded endpoints return `503` rather than silently becoming unlimited. Non-production may use the existing memory fallback, documented in code as unsuitable for multiple processes.

## Administrator Bootstrap

`backend/scripts/createAdmin.js` will require `ADMIN_EMAIL` and `ADMIN_PASSWORD`; it will not contain defaults. It will validate the email and password strength, use the normal `User` model save path, never print the password, report whether the administrator was created or already existed, and always close the MongoDB connection. These variables are bootstrap-only and should be removed from the runtime service after use.

## Job Update Authorization

Job creation and updates will select fields from a fixed allowlist:

- `title`
- `description`
- `shortDescription`
- `location`
- `jobType`
- `workMode`
- `experienceLevel`
- `salary`
- `skills`
- `requirements`
- `responsibilities`
- `benefits`
- `category`
- `status`
- `applicationDeadline`
- `contactEmail`

The route will ignore or reject protected fields such as `company`, `companyName`, `featured`, application/view counts, IDs, and timestamps. Ownership continues to come from the authenticated employer, never request input. The same allowlist helper will serve create and update so the trust boundary is defined once.

## CORS And Frontend URLs

The backend CORS callback will allow only configured origins in production. Requests without an `Origin` header remain valid for server-to-server and health checks. Unknown browser origins receive a CORS rejection. Development may include the configured Vite localhost origin.

`FRONTEND_URL` will build email verification and reset links. `CORS_ORIGINS` controls browser access independently when more than one deployed frontend origin is required.

The frontend will keep `VITE_API_URL` as the API base and derive the backend origin from it in one utility. Hardcoded `http://localhost:5000` asset URLs will use that utility. A production build fails clearly when `VITE_API_URL` is missing or is a localhost URL. Development retains its current localhost default.

## Upload And CV Safety

Multer's size and extension checks remain, but client-supplied MIME type will no longer be trusted as proof of file content. Before storage or parsing, a shared validator will check the file signature for the supported formats:

- PDF begins with `%PDF-`.
- Legacy DOC uses the OLE compound-file signature.
- DOCX is a ZIP container and contains the expected Word document entries.

CV uploads are scanned before parsing or AI processing. In production, ClamAV must be reachable during startup and every CV must receive a clean result before it is persisted as usable or passed to a parser. Infected, malformed, and unscannable files are rejected; scanner errors fail closed with `503`. The current 5 MB limit remains.

Message attachments keep their pending/clean/infected lifecycle, but receive signature validation before storage. Downloads remain blocked until the malware scan reports clean. A production scanner outage leaves an attachment unavailable rather than releasing it unchecked.

Development may bypass ClamAV only with `CLAMAV_REQUIRED=false`; signature validation always runs.

## Message Confidentiality

The existing AES-GCM implementation and installed platform crypto APIs will be moved into one shared utility. Key validation moves to startup. Both `Message.content` and `Conversation.lastMessage.content` will use the utility's encryption setter and decryption getter so API responses retain the current plaintext preview behavior while MongoDB stores ciphertext. The text index and server-side text-search method on encrypted message content will be removed because they cannot provide correct search results.

The deployed `MESSAGE_ENCRYPTION_KEY` must remain available for existing ciphertext. Rotating it without re-encrypting existing messages makes those messages unreadable, so key rotation requires a separate migration or acceptance of losing old message content.

## Error Handling And Logging

Trust-boundary failures will use consistent semantics:

- `400` for malformed input.
- `401` for invalid authentication or invalid/expired bearer challenges where revealing existence is unsafe.
- `403` for authenticated users lacking permission.
- `422` for a recognized but unsafe upload.
- `429` for rate limits, with `Retry-After`.
- `503` when a required security dependency is unavailable.

Logs may include request IDs, operation names, user IDs, and dependency names. They must not include passwords, PINs, reset tokens, authorization headers, message plaintext, encryption keys, connection strings, or complete uploaded document content.

## Migration And Deployment Order

1. Revoke and replace every credential that was present in Git history: MongoDB, Redis, Gmail/app password, JWT secret, and any exposed message-encryption key.
2. Decide whether existing encrypted messages must survive encryption-key rotation; migrate ciphertext before switching keys if required.
3. Deploy MongoDB-compatible model changes and application code with all required environment variables.
4. Delete legacy `EmailVerification` and `PasswordReset` documents before accepting traffic.
5. Run the environment-driven administrator bootstrap only if an administrator is needed, then remove its password from the runtime environment.
6. Verify Redis and ClamAV connectivity, allowed frontend origins, health checks, and a production frontend build.
7. Exercise signup/verification, login, reset invalidation, job editing, CV upload, attachment scanning, and message retrieval using non-production accounts.

No destructive migration is required for `tokenVersion`. The legacy verification and reset collections contain temporary challenges, not durable user content.

## Verification Strategy

Focused Jest tests will cover the changed boundaries without introducing a new test framework:

- Environment validation accepts complete production settings and rejects missing, placeholder, malformed, or localhost-only values.
- Registration stores a bcrypt password on `User` and a bcrypt PIN hash in the challenge, with no plaintext copy.
- Verification enforces expiry and attempt limits and removes a successful challenge.
- Reset lookup uses SHA-256 token hashes and increments `tokenVersion` after success.
- Authentication rejects a JWT with an obsolete token version.
- Redis rate limiting returns the expected remaining window, `429`, and production `503` behavior.
- Job input selection cannot modify protected fields.
- Signature validation accepts supported fixtures and rejects renamed or malformed files.
- CV processing rejects infected and unavailable-scan results before parsing.
- Administrator bootstrap refuses missing credentials and contains no defaults.

Repository verification will also run backend tests, backend syntax/startup checks with test configuration, frontend linting if configured, and a production frontend build.

## Acceptance Criteria

- No reachable Git ref contains a committed `.env` file, and runtime secret files remain ignored.
- No application collection stores a plaintext password, verification PIN, or reset bearer token.
- Password reset/change makes earlier JWTs unusable.
- Authentication, messaging, and attachment limiters are active; production fails closed when Redis is unavailable.
- Administrator creation has no embedded credentials.
- Employers cannot update protected job ownership or administrative fields through request bodies.
- Production accepts browser requests only from configured origins and generated frontend URLs contain no localhost dependency.
- Unsupported, malformed, infected, or unscannable CVs never reach document parsing or AI processing.
- Message previews do not persist plaintext bodies.
- Production startup rejects unsafe or incomplete security configuration.
- Focused security tests and the frontend production build pass.
