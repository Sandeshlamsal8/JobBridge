# JobBridge Deployment Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining security and configuration blockers that prevent JobBridge from being deployed as a secure single-instance production application.

**Architecture:** Validate runtime configuration before startup, keep security-sensitive transformations in small shared utilities, and enforce controls at Express trust boundaries. Reuse Mongoose hooks, Node crypto, Redis, ClamAV, and the current frontend API configuration instead of introducing new infrastructure.

**Tech Stack:** Node.js CommonJS, Express, Mongoose, Redis, bcryptjs, jsonwebtoken, ClamAV, Jest, React, Vite.

**Spec:** `docs/superpowers/specs/2026-08-29-deployment-hardening-design.md`

## Global Constraints

- Production requires MongoDB, Redis, SMTP, ClamAV, a 32-character JWT secret, a 64-hex-character message key, and HTTPS frontend/CORS origins.
- Production security dependencies fail closed; development bypasses must be explicit.
- Never log or persist plaintext passwords, PINs, reset tokens, message bodies, or secret configuration values.
- Keep bearer JWT/sessionStorage authentication; cookie/refresh-token redesign is outside scope.
- Keep the current 5 MB CV limit and current single-instance deployment model.
- Use existing dependencies and Node standard-library crypto; add no new package.

---

### Task 1: Runtime Configuration And Startup

**Files:**
- Create: `backend/config/env.js`
- Create: `backend/tests/env.test.js`
- Modify: `backend/server.js`
- Modify: `backend/config/redis.js`
- Modify: `backend/services/attachmentService.js`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `loadEnv(source = process.env)` returning normalized configuration; `startServer()` and `shutdown()`; `initializeRedis(url)`; `verifyScanner()`.

- [ ] **Step 1: Write the failing configuration tests**

```js
const { loadEnv } = require("../config/env");

test("rejects incomplete production configuration", () => {
  expect(() => loadEnv({ NODE_ENV: "production" })).toThrow("MONGODB_URI");
});

test("accepts secure production configuration", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    MONGODB_URI: "mongodb://db/jobbridge",
    JWT_SECRET: "j".repeat(32),
    MESSAGE_ENCRYPTION_KEY: "a".repeat(64),
    FRONTEND_URL: "https://jobs.example.com",
    CORS_ORIGINS: "https://jobs.example.com",
    REDIS_URL: "redis://redis:6379",
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "mailer",
    SMTP_PASS: "secret",
    CLAMAV_HOST: "clamav",
    CLAMAV_PORT: "3310",
    CLAMAV_TIMEOUT: "60000",
    CLAMAV_REQUIRED: "true",
  });
  expect(env.corsOrigins).toEqual(["https://jobs.example.com"]);
});
```

- [ ] **Step 2: Run `npm test -- --runInBand tests/env.test.js` from `backend` and confirm the missing module failure.**
- [ ] **Step 3: Implement strict parsing without logging values; refactor startup to await MongoDB, Redis, GridFS, and required ClamAV before listening, and close resources on signals.**
- [ ] **Step 4: Run the focused test and `node --check server.js`; update `.env.example` with every required key.**

### Task 2: Authentication Secrets And Token Invalidation

**Files:**
- Create: `backend/utils/securityTokens.js`
- Create: `backend/tests/securityTokens.test.js`
- Modify: `backend/models/EmailVerification.js`
- Modify: `backend/models/PasswordReset.js`
- Modify: `backend/models/User.js`
- Modify: `backend/routes/auth.js`
- Modify: `backend/middleware/auth.js`

**Interfaces:**
- Produces: `hashResetToken(token): string`, `hashPin(pin): Promise<string>`, `comparePin(pin, hash): Promise<boolean>`, and JWT payload field `tokenVersion`.

- [ ] **Step 1: Write failing token tests**

```js
const { hashResetToken, hashPin, comparePin } = require("../utils/securityTokens");

test("reset tokens are deterministic SHA-256 hashes", () => {
  expect(hashResetToken("secret")).toMatch(/^[a-f0-9]{64}$/);
  expect(hashResetToken("secret")).toBe(hashResetToken("secret"));
});

test("PIN hashes do not expose the PIN", async () => {
  const hash = await hashPin("123456");
  expect(hash).not.toContain("123456");
  await expect(comparePin("123456", hash)).resolves.toBe(true);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because `securityTokens` does not exist.**
- [ ] **Step 3: Implement the crypto utility, replace verification schema fields with `userId` and `pinHash`, replace reset `token` with unique `tokenHash`, and add `tokenVersion: 0` to users.**
- [ ] **Step 4: Change signup to save an unverified user through the model hook, bcrypt-hash challenges, rotate resend challenges, and compare hashes during verification.**
- [ ] **Step 5: Hash reset tokens before storage/query, increment `tokenVersion` on reset, include it in every JWT, reject stale versions in required and optional auth, and reject login for unverified accounts.**
- [ ] **Step 6: Run token tests and syntax-check the changed auth/model files.**

### Task 3: Redis Rate Limits

**Files:**
- Create: `backend/middleware/rateLimit.js`
- Create: `backend/tests/rateLimit.test.js`
- Modify: `backend/routes/auth.js`
- Modify: `backend/routes/messaging.js`
- Modify: `backend/services/rateLimiter.js`
- Modify: `backend/utils/redisUtils.js`

**Interfaces:**
- Produces: `createRateLimiter({ name, limit, windowSeconds, key })`; one atomic Redis script returning counter and TTL.

- [ ] **Step 1: Write a failing middleware test with an injected store**

```js
test("returns 429 and Retry-After after the configured limit", async () => {
  const limiter = createRateLimiter({
    name: "login",
    limit: 1,
    windowSeconds: 60,
    store: async () => ({ count: 2, ttl: 41 }),
  });
  const res = responseRecorder();
  await limiter({ ip: "127.0.0.1", body: {} }, res, jest.fn());
  expect(res.statusCode).toBe(429);
  expect(res.headers["Retry-After"]).toBe("41");
});
```

- [ ] **Step 2: Run the focused test and confirm the missing middleware failure.**
- [ ] **Step 3: Implement the injectable middleware and Redis Lua counter; return `503` on Redis failure in production and use a documented in-memory fixed window outside production.**
- [ ] **Step 4: Apply the approved signup/login/verify/resend/reset limits and make message/attachment checks increment atomically before work begins.**
- [ ] **Step 5: Run limiter tests and syntax-check auth and messaging routes.**

### Task 4: Administrator And Job Field Authorization

**Files:**
- Create: `backend/utils/jobFields.js`
- Create: `backend/tests/jobFields.test.js`
- Modify: `backend/routes/jobs.js`
- Modify: `backend/scripts/createAdmin.js`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `pickJobFields(input): object` containing only the spec allowlist.

- [ ] **Step 1: Write the failing allowlist test**

```js
test("drops ownership and administrative job fields", () => {
  expect(pickJobFields({ title: "Engineer", company: "attacker", featured: true }))
    .toEqual({ title: "Engineer" });
});
```

- [ ] **Step 2: Run the test and confirm the helper is missing.**
- [ ] **Step 3: Implement one allowlist helper and use it for job create and update instead of spreading or assigning the request body.**
- [ ] **Step 4: Require `ADMIN_EMAIL` and `ADMIN_PASSWORD`, validate them, use normal user save behavior, avoid password output, and close MongoDB in `finally`.**
- [ ] **Step 5: Run the focused test, syntax-check both entry points, and search for remaining hardcoded administrator credentials or job mass assignment.**

### Task 5: Upload Signatures And Malware Scanning

**Files:**
- Create: `backend/utils/fileValidation.js`
- Create: `backend/tests/fileValidation.test.js`
- Modify: `backend/middleware/upload.js`
- Modify: `backend/services/attachmentService.js`
- Modify: `backend/routes/applications.js`

**Interfaces:**
- Produces: `detectDocumentType(buffer): "pdf" | "doc" | "docx" | null`, `validateUploadedFile(file)`, `scanBuffer(buffer)` and `verifyScanner()`.

- [ ] **Step 1: Write failing signature tests using small byte fixtures for PDF, OLE DOC, a minimal DOCX ZIP, and renamed invalid content.**
- [ ] **Step 2: Run the focused test and confirm the validator is missing.**
- [ ] **Step 3: Implement signature checks using `Buffer` and ZIP entry-name parsing already available through the DOCX container; reject a mismatch between signature and allowed MIME/extension.**
- [ ] **Step 4: Run validation after Multer buffers each CV/attachment, scan CVs synchronously before persistence/parsing, and fail closed in production when scanning is unavailable.**
- [ ] **Step 5: Preserve attachment pending/clean/infected download behavior, run focused tests, and syntax-check upload/application/attachment files.**

### Task 6: Message Preview Encryption

**Files:**
- Create: `backend/utils/messageCrypto.js`
- Create: `backend/tests/messageCrypto.test.js`
- Modify: `backend/models/Message.js`
- Modify: `backend/models/Conversation.js`
- Modify: `backend/services/messageService.js`

**Interfaces:**
- Produces: `encryptMessage(text): string` and `decryptMessage(ciphertext): string` using AES-256-GCM and validated environment key.

- [ ] **Step 1: Write a failing round-trip test that asserts ciphertext excludes plaintext and decrypts with a fixed 64-hex key.**
- [ ] **Step 2: Run it and confirm the utility is missing.**
- [ ] **Step 3: Move the existing AES-GCM logic to the utility, apply setters/getters to message and conversation preview content, and remove encrypted text search/index code.**
- [ ] **Step 4: Run the focused test and syntax-check models/services.**

### Task 7: Frontend Deployment URL

**Files:**
- Create: `frontend/src/utils/config.js`
- Modify: `frontend/src/utils/api.js`
- Modify: frontend components/pages containing literal `http://localhost:5000`
- Modify: `frontend/.env.example`

**Interfaces:**
- Produces: `API_URL` and `backendUrl(path)` derived from `VITE_API_URL`.

- [ ] **Step 1: Create the config utility with a development localhost default and a production guard that throws for missing/localhost `VITE_API_URL`.**
- [ ] **Step 2: Replace literal backend origins in image/document URLs with `backendUrl`; keep existing API request behavior.**
- [ ] **Step 3: Search the frontend source for remaining `localhost:5000` literals outside the central development default.**
- [ ] **Step 4: Run `npm run lint` and `npm run build` from `frontend`.**

### Task 8: Integrated Verification And Documentation

**Files:**
- Modify: `backend/.env.example`
- Modify: `frontend/.env.example`
- Modify: plan checkboxes in this file

**Interfaces:**
- Consumes all previous tasks; produces a deployable branch and operator environment contract.

- [ ] **Step 1: Run `npm test -- --runInBand` from `backend`.**
- [ ] **Step 2: Run `node --check` on every changed backend JavaScript file.**
- [ ] **Step 3: Run `npm run lint` and `npm run build` from `frontend`.**
- [ ] **Step 4: Run secret-pattern, hardcoded-localhost, plaintext challenge-field, and mass-assignment searches; inspect every result.**
- [ ] **Step 5: Run `git diff --check`, inspect the full diff, and confirm every acceptance criterion in the design spec has an implementation or documented external deployment action.**
