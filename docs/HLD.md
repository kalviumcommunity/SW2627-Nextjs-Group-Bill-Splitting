# High-Level Design

## 1. System context

Cred Group Bill Splitting is a browser-based Next.js application. The browser communicates with App Router pages and route handlers. Route handlers call domain services, which validate input and use Prisma to access PostgreSQL. Email delivery and proof storage are external integrations.

```text
Browser
  |
  v
Next.js pages and API route handlers
  |             |                 |
  v             v                 v
Services    Session cookie     Email provider
  |
  v
Prisma Client
  |
  v
PostgreSQL

Proof upload route ---> Cloudinary (production when configured)
                   \-> public/uploads (local development fallback)
```

## 2. Major components

### Presentation layer

- `src/app/**/page.js` contains route-level pages.
- `src/components/` contains authentication forms and creator/payer/dashboard UI.
- `src/app/globals.css` contains shared styling.

### API layer

- `src/app/api/auth/**` handles registration, login, logout, OTP, password reset, current-user lookup, and authenticated contributions.
- `src/app/api/expenses/route.js` returns creator or payer expense views.
- `src/app/api/dashboard/route.js` builds dashboard statistics and recent activity.
- `src/app/api/contributions/review/route.js` authorizes creator review actions.
- `src/app/api/upload/route.js` handles authenticated multipart proof uploads.

### Domain layer

- `auth.service.js`: registration and login validation and persistence.
- `otp.service.js`: OTP generation, hashing, verification, expiry, attempt limits, and account verification.
- `session.service.js`: signed session creation and constant-time signature verification.
- `expense.service.js` and `expense-split.service.js`: split validation, allocation, and persistence.
- `contribution.service.js`: contribution validation, deadline checks, amount limits, and idempotency.
- `payment-proof.service.js`: one-proof-per-contribution persistence.
- `contribution-history.service.js`: contribution history retrieval.

### Persistence layer

Prisma maps the domain to PostgreSQL. Decimal columns are used for money, unique constraints protect email, member assignment, contribution idempotency, and one proof per contribution, and indexes support common user/status/deadline lookups.

### External integrations

- SMTP/email service sends verification and password-reset OTPs.
- Cloudinary stores uploaded proofs when its credentials are configured.
- Local filesystem storage is used as a development fallback.

## 3. Primary request flows

### Registration and verification

1. Browser posts registration data to `/api/auth/register`.
2. The route validates and creates the user through `auth.service.js`.
3. The route creates a hashed verification OTP and sends it through the email service.
4. Browser posts the OTP to `/api/auth/verify-otp`.
5. The route marks the OTP used, marks the user verified, and sets the signed session cookie.

### Login

1. Browser posts credentials to `/api/auth/login`.
2. The auth service validates credentials and requires `emailVerified`.
3. The route creates `cred_split_session`, an HTTP-only signed cookie with a seven-day lifetime.
4. Protected routes parse and verify this cookie before accessing user data.

### Split and contribution lifecycle

```text
Create split
    |
    v
ACTIVE ---- deadline reached ----> CLOSED
    |
    v
Contribution PENDING
    |                   |
 creator approves       creator rejects
    v                   v
ACCEPTED              REJECTED
```

Accepted contributions reduce the member's remaining amount. Pending contributions are shown separately and do not count as settled.

### Proof review

1. The authenticated payer uploads a file through `/api/upload`.
2. The upload route stores it in Cloudinary or local development storage and returns a URL.
3. The client associates that URL and file name with a contribution.
4. The creator posts an approve/reject action to `/api/contributions/review`.
5. The route checks that the current session user owns the related expense before updating review fields.

## 4. Deployment view

```text
Next.js deployment (Node/serverless runtime)
  - App Router pages
  - Route handlers
  - Prisma client
       |
       +--> PostgreSQL database
       +--> SMTP server
       +--> Cloudinary (recommended for proof files)
```

Required runtime configuration includes a PostgreSQL connection, `AUTH_SECRET`, and email settings. Cloudinary settings are required for durable proof storage in serverless deployments.

## 5. Security design

- Passwords are hashed with the password utility; plaintext passwords are not persisted.
- OTP values are hashed, expire, and stop accepting attempts after the configured limit.
- Session values are HMAC-signed and checked with a timing-safe comparison.
- Session cookies are HTTP-only, `SameSite=Lax`, and secure in production.
- Protected user-data and creator-review routes reject missing or invalid sessions; public account flows and the user lookup used during split creation are intentionally separate.
- Creator review checks ownership of the related expense.
- Prisma parameterizes normal database operations; validation occurs before domain writes.
- Secrets are supplied through environment variables and must not be committed.

## 6. Availability and failure handling

- Route handlers return JSON with meaningful HTTP status codes.
- Database uniqueness errors are translated to conflict responses where applicable.
- Email and storage failures are logged and surfaced as failed requests.
- The database is the source of truth for balances and review status.
- Cloudinary is optional for local development, but production deployments should use durable external storage.

## 7. Observability

Current route handlers log server-side errors with operation-specific prefixes. Operational monitoring should track:

- HTTP 4xx/5xx rates by route.
- OTP failure and resend rates.
- Contribution creation conflicts and review failures.
- Database latency and connection errors.
- Upload failures and external provider response errors.
