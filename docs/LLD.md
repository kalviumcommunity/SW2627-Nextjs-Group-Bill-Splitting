# Low-Level Design

## 1. Repository structure

```text
src/
  app/
    api/                 Route handlers and HTTP contracts
    components/pages     Browser-facing screens
  components/            Reusable client UI
  services/              Domain operations
  utils/                 Validation, hashing, OTP, and split algorithms
  lib/prisma.js          Prisma client singleton
prisma/
  schema.prisma          Database model and enum definitions
```

## 2. Data model

### User

| Field | Type | Constraints / purpose |
|---|---|---|
| `id` | String | Primary key, generated CUID |
| `email` | String | Required and unique |
| `name` | String | Display name |
| `age` | Int | Registration data |
| `passwordHash` | String | Hashed password |
| `emailVerified` | Boolean | Defaults to `false` |

Relations: created expenses, expense memberships, OTP records, and reviewed contributions.

### OtpVerification

Stores a hashed OTP, purpose, expiry, attempt count, used timestamp, and owning user. `purpose` is `EMAIL_VERIFICATION` or `PASSWORD_RESET`. Records are indexed by user and expiry.

### Expense

Stores creator, optional title, total decimal amount, deadline, status, timestamps, members, and an optional shortfall. Status is `ACTIVE` or `CLOSED`.

### ExpenseMember

Join entity between `Expense` and `User`. It stores one user's assigned decimal amount. `(expenseId, userId)` is unique, preventing duplicate membership in a split.

### Contribution

Stores the expense-member target, decimal amount, review status, unique idempotency key, submission/review timestamps, reviewer, and optional rejection reason. Status is `PENDING`, `ACCEPTED`, or `REJECTED`.

### PaymentProof

Stores one proof per contribution through a unique `contributionId`, plus the URL, original file name, and upload timestamp.

### Shortfall

Stores an optional one-to-one open or settled amount for an expense. It is part of the persisted model for future shortfall settlement workflows.

## 3. API contracts

| Method and route | Authentication | Purpose |
|---|---|---|
| `POST /api/auth/register` | Public | Create account and send verification OTP |
| `POST /api/auth/login` | Public | Authenticate verified user and set session |
| `POST /api/auth/logout` | Public/session | Delete session cookie |
| `GET /api/auth/me` | Session | Return current user |
| `POST /api/auth/verify-otp` | Public | Verify email OTP and create session |
| `POST /api/auth/resend-otp` | Public | Send a new verification OTP |
| `POST /api/auth/forgot-password` | Public | Send password-reset OTP |
| `POST /api/auth/reset-password` | Public | Verify reset OTP and update password |
| `GET /api/dashboard` | Session | Return user stats and recent activity |
| `GET /api/expenses?role=creator\|payer` | Session | Return role-specific expense views |
| `POST /api/expenses` | Session | Create a split |
| `POST /api/auth/contributions` | Session | Create a contribution |
| `GET /api/auth/contributions/[expenseMemberId]` | Session | Return contribution history |
| `POST /api/auth/contributions/payment-proof` | Authenticated flow | Persist proof metadata for a contribution |
| `POST /api/upload` | Session | Upload proof file and return storage URL |
| `POST /api/contributions/review` | Session | Approve or reject a contribution |
| `GET /api/users/check` | Session/public flow | Check whether a user can be selected for a split |

Successful responses use `success: true` and return a resource or view-specific payload. Validation, authorization, conflict, not-found, and server failures use `success: false` with a descriptive `message` and, where useful, field-level `errors`.

The upload endpoint establishes the authenticated file-upload boundary. The proof-metadata endpoint is the follow-up persistence step and must only be called by the authenticated client flow after a successful upload; it should be kept behind the same authorization boundary when deployed.

## 4. Core algorithms

### Equal split

`calculateEqualSplit(totalAmount, memberCount)` divides the total into decimal shares and distributes any rounding remainder deterministically so the sum of assigned amounts equals the total. The split service maps each share to a user ID.

### Remaining balance

For each expense member:

```text
accepted = sum(contribution.amount where status = ACCEPTED)
remaining = max(0, assignedAmount - accepted)
```

Pending amounts are calculated separately for display and do not reduce `remaining`.

### Contribution creation

1. Validate `expenseMemberId`, amount, and idempotency key.
2. Reject an existing idempotency key.
3. Load the expense member and related expense.
4. Reject missing members, closed/expired expenses, or amounts above the assignment.
5. Create a `PENDING` contribution.

### Session verification

The session value is `userId.expiresAt.signature`, where the signature is an HMAC-SHA256 digest of `userId.expiresAt`. Verification rejects malformed or expired values and compares signatures with `timingSafeEqual`.

## 5. Validation and error behavior

| Condition | HTTP status | Expected behavior |
|---|---:|---|
| Invalid request fields | 400 | Return field-level validation errors |
| Invalid credentials | 401 | Return generic authentication failure |
| Missing/invalid session | 401 | Reject protected operation |
| Unverified account | 403 | Require email verification |
| Non-owner review request | 403 | Reject creator-only action |
| Missing resource | 404 | Return resource-not-found message |
| Duplicate email, proof, or idempotency key | 409 | Reject duplicate operation |
| OTP attempt limit reached | 429 | Require a new OTP |
| Unexpected dependency/database failure | 500 | Log server-side details and return safe message |

## 6. Environment configuration

| Variable | Used by | Required |
|---|---|---|
| `DATABASE_URL` or Prisma PostgreSQL configuration | Prisma/PostgreSQL | Yes |
| `AUTH_SECRET` | Signed sessions | Yes |
| SMTP host, port, user, and password variables | Email service | Yes for email flows |
| `CLOUDINARY_CLOUD_NAME` | Proof storage | Recommended in production |
| `CLOUDINARY_API_KEY` | Proof storage | Required with Cloudinary |
| `CLOUDINARY_API_SECRET` | Proof storage | Required with Cloudinary |

Values must be supplied through local environment configuration or deployment secrets, never committed to source control.

## 7. Transaction and consistency notes

- Creating an expense and its members should remain one Prisma nested create so a failed member insert does not leave a partial split.
- Contribution idempotency is enforced by both an application lookup and the database unique constraint; callers should safely handle a conflict response.
- A proof is one-to-one with a contribution at the database level.
- Review updates record status, reviewer, review time, and rejection reason together.
- Monetary calculations convert Prisma decimals only at API/view boundaries; persistence uses decimal columns.

## 8. Test focus

The highest-value automated tests should cover:

- Registration validation, duplicate email, login, verification, and reset OTP expiry/attempt limits.
- Equal and custom split totals, rounding, invalid members, and duplicate memberships.
- Contribution amount limits, deadline/closed checks, idempotency conflicts, and status totals.
- Creator-only review authorization and rejection reasons.
- Session signature, expiry, malformed values, and cookie attributes.
- Cloudinary success, local fallback, invalid uploads, and proof uniqueness.
