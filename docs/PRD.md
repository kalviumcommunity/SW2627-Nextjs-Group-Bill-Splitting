# Product Requirements Document

## 1. Product overview

**Cred Group Bill Splitting** helps people create a shared bill, assign each participant an amount, collect contributions, and verify submitted payment proofs. A user can act as both a split creator and a payer.

The product is implemented as a Next.js web application with a PostgreSQL database. The primary currency displayed by the current UI is Indian rupees (INR).

## 2. Problem statement

Informal group expenses are difficult to track when participants use separate payment channels. Creators need a reliable view of who owes what and which payments are verified; payers need a clear amount due, deadline, and payment history.

## 3. Goals

- Make a group split easy to create with equal or custom member allocations.
- Give creators a single view of collection progress and outstanding amounts.
- Let payers see assignments, accepted payments, pending reviews, and deadlines.
- Support payment-proof submission and creator approval or rejection.
- Protect accounts with password authentication, email verification, and password recovery.
- Prevent duplicate contribution submissions through idempotency keys.

## 4. Personas

### Split creator

Creates a bill, assigns participants, monitors collection, and reviews payment proofs.

### Payer

Views assigned bills, submits one or more contributions up to the assigned amount, and attaches payment evidence.

### Platform operator

Maintains the application, database, email provider, and optional file-storage integration. The current product does not expose a separate operator console.

## 5. Functional requirements

### Authentication and account management

1. A user can register with name, email, age, and password.
2. Registration sends a six-digit email verification OTP.
3. A user must verify the email before login is accepted.
4. A verified user can log in and receive a seven-day HTTP-only signed session cookie.
5. A user can log out and invalidate the session cookie.
6. A user can request a password-reset OTP and set a new password.
7. OTPs expire and failed verification attempts are capped.

### Split creation and management

1. An authenticated creator can create a split with a title, total amount, deadline, and members.
2. The system supports equal allocation and explicitly assigned member amounts.
3. The system validates that the split and member allocations are valid before persistence.
4. A split is active until it is closed or its deadline is reached.
5. Expired active splits are automatically marked closed when expense data is read.

### Contributions and proof review

1. A payer can submit a contribution for an assigned expense member.
2. A contribution cannot exceed the member's assigned amount.
3. A contribution cannot be submitted after the split is closed or its deadline has passed.
4. Each contribution has `PENDING`, `ACCEPTED`, or `REJECTED` status.
5. A payer can attach one payment proof to a contribution.
6. Only the split creator can approve or reject a contribution.
7. Rejected contributions may include a reason.
8. Repeated submissions with the same idempotency key are rejected.

### Dashboards and history

1. The dashboard shows creator statistics, payer statistics, and recent activity.
2. Creators can view member allocations, accepted amounts, pending review amounts, and proofs.
3. Payers can view assigned amount, accepted amount, pending amount, remaining amount, deadline, and contribution history.

## 6. Non-functional requirements

- **Security:** Passwords and OTPs are stored as hashes; sessions are signed and HTTP-only; protected routes require a valid session.
- **Reliability:** Database writes return explicit success or error responses and use unique constraints for email and idempotency keys.
- **Consistency:** Monetary values use PostgreSQL decimal types and contribution totals are calculated from accepted contributions.
- **Usability:** Validation errors and contribution/review statuses are visible to the user.
- **Deployability:** The application can use Cloudinary for serverless-compatible proof storage and a local `public/uploads` fallback for development.
- **Maintainability:** Domain operations are kept in service modules, validation is kept in utility modules, and API routes translate service results to HTTP responses.
- **Performance:** Dashboard and expense queries should remain bounded to the user's related records and use the schema indexes.

## 7. MVP acceptance criteria

- A new user can register, verify an OTP, log in, and log out.
- A creator can create an equal or custom split for registered users.
- A payer can submit a valid contribution and see it as pending.
- A creator can approve or reject the contribution.
- Accepted amounts and remaining balances are reflected in creator and payer views.
- Invalid, duplicate, over-limit, expired, and unauthorized operations return a meaningful HTTP error.
- Password reset works through an emailed OTP.

## 8. Out of scope

- Direct payment processing or payment-provider reconciliation.
- Automatic bank or wallet transaction verification.
- Multi-currency settlement.
- Native mobile applications.
- An administrator dashboard and role-based operator controls.
- Notifications beyond the current email OTP flows.

## 9. Success measures

- Percentage of registered users who complete email verification.
- Percentage of created splits with at least one contribution.
- Percentage of contributions reviewed by the deadline.
- Rate of duplicate contribution attempts prevented by idempotency.
- API error rate for authentication, split creation, contribution, and review flows.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Payment proof is not genuine | Keep creator approval as the final acceptance step; retain proof metadata and review information. |
| A split is paid after its deadline | Enforce deadline checks during contribution creation and close expired splits during expense reads. |
| Duplicate requests create duplicate contributions | Require a unique idempotency key. |
| Local file storage is ephemeral in serverless deployment | Prefer Cloudinary when deployment credentials are configured. |
| OTP abuse | Hash OTPs, expire them, and cap failed attempts. |
