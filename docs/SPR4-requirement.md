# Sprint 4 Requirements and E2E Acceptance

Status: consolidated working requirement, 03/11/2026

This document records the E01-E18 acceptance criteria and work split supplied by the team. Domain rules remain governed by [the unified MedSi baseline](MedSi_Tai_lieu_thong_nhat_v0.1.md); physical columns and constraints remain governed by [schema v1.1](medsi_schema_v1.sql). A mismatch requires a Change Request; this document does not silently override either source.

## Project Readiness

The project is not yet E2E-complete. The current backend has migrations for the 14 business tables, status enums, MedSi config, base `User`/`Booking`/`Slot` models, a T01-T16 `BookingStateMachine`, state transition unit tests, and an opt-in MySQL E13 concurrency test. The API still exposes only `GET /api/health`; business controllers, auth/RBAC endpoints, payment/refund services, scheduler jobs, sample seed data, and frontend API integration remain to be implemented.

Current validation: migrations completed on the dedicated MySQL `medsi_test` database; state transition tests pass; E13 passes on MySQL/InnoDB. This is not evidence that E01-E18 pass. `DatabaseSeeder` has no fixtures yet. Do not run `migrate:fresh` against a shared or data-bearing database.

The legacy migration files have been removed and no data backfill/upgrade migration exists. Developers with an existing database from the old schema must create a new local database or agree on a backup/backfill plan; running the new migrations against the old database is not a supported upgrade path.

## Decisions for Acceptance

- Account roles: `patient`, `doctor`, `staff`, `admin`; `guest` has no account.
- No kiosk role or kiosk account. Check-in is performed by `staff` assigned to the booking's hospital or by Admin.
- Voucher is out of Sprint 4; `discount_amount` defaults to 0.
- Slot-full conflict returns API code `SE001`.
- Doctor cancellation under E09 blocks the affected slot only; handling other future slots/bookings must follow the approved policy.
- Times and slot dates use `Asia/Ho_Chi_Minh`. Currency is integer VND; service fee is 20,000 VND.
- Never use real patient information in fixtures or demos.

## E2E Acceptance

| ID | Scenario and setup | Steps | Expected result |
|---|---|---|---|
| E01 | Doctor appointment. Doctor has an available slot; patient has a consented profile; check-in actor is scoped `staff` or Admin. | Patient creates booking (T01), pays QR 220,000 (T02), doctor approves (T05), staff checks in (T09), doctor completes visit (T12). | `booked_count` increases once and remains held through completion; payment is `paid` with 220,000 received; ticket moves `issued` → `checked_in` → `completed` and has a queue number; no refund; required AU events are recorded (AU-10, AU-11, AU-12, AU-14). AU event meanings/counts must match the shared audit catalog. |
| E02 | Hospital has an available CK03 slot; exam type costs 200,000. | Select hospital, specialty, exam type, slot and profile; hold for 15 minutes; pay QR 220,000; system confirms (T02H); view ticket. | Booking becomes `confirmed` without `pending_approval`; ticket is `issued` with CK03 queue number; `doctor_id` is null; payment is `paid`. |
| E03 | Doctor slot has one place. | Create booking (T01), do not pay, wait 15 minutes plus the 5-minute pending-transaction grace when applicable, run expiry job (T03). | Booking is `expired`; `booked_count` decreases once; slot is available; payment is `expired`; no refund; rerunning the job has no duplicate effect. |
| E04 | Booking is `pending_payment` and hold has not expired. | Gateway reports failure (T14); verify hold is unchanged; retry and pay successfully (T02). | One booking and one payment; transactions contain one `failed` and one `success`; booking becomes `pending_approval`; duplicate callback for the same transaction code is idempotent (T15). |
| E05 | Doctor booking is `pending_approval`, paid 220,000. | Doctor rejects with reason (T06); system requests refund; Admin approves, processes and succeeds it. | Booking `rejected`; slot count decremented once; refund is 220,000 (200,000 exam + 20,000 service), policy `doctor_rejected`; payment refunded amount is 220,000 and status `refunded`. |
| E06 | Doctor booking is `pending_approval`; doctor does not respond. | Wait beyond 30 minutes; run expiry job (T07); Admin approves refund. | Booking `expired`; slot count decremented once; full 220,000 refund request is created and approved. |
| E07 | Booking is `confirmed`, more than 24 hours before slot start. | Patient cancels with reason (T10); system requests refund; Admin approves. | Booking and ticket `cancelled`; slot count decremented once; refund is 200,000 exam fee and 0 service fee; payment remains `paid` while partially refunded. |
| E08 | Booking is `confirmed`, less than 24 hours before slot start. | Patient cancellation is rejected with support guidance; Admin cancels with reason (T10) and approves refund. | Only Admin can cancel; refund is 100,000 (50% exam fee), no service fee; required AU-11 and AU-16 events are recorded. Voucher remains disabled and `discount_amount` is 0. |
| E09 | Doctor has a `confirmed` booking. | Doctor cancels with reason; affected slot is blocked; system requests refund; Admin approves. | Booking and ticket `cancelled`; affected slot is `blocked`; full 220,000 refund; audit includes the cancellation reason. |
| E10 | Booking is already `expired` (as in E03). | Gateway reports a successful late collection of 220,000 (T16); Admin approves refund. | Booking remains `expired`; a `success` transaction is added; `received_amount` is 220,000; full refund request has policy `late_payment`. |
| E11 | Booking is already paid (as in E01). | Gateway sends another 220,000 transaction with a different transaction code; Admin reconciles and approves refund. | First transaction is retained; received amount is 440,000; duplicate-payment refund is 220,000 with policy `duplicate_payment`; refunded amount never exceeds received amount. |
| E12 | Confirmed doctor booking is at least 15 minutes past start, or hospital booking is 120 minutes past slot end; ticket has not been checked in. | Job marks no-show eligible; Admin confirms no-show (T11); Admin handles any complaint. | Booking `no_show`; ticket `expired`; no refund; audit records the confirming Admin. |
| E13 | Slot has capacity 1 and `booked_count` 0. | Two different patient accounts concurrently request the final place. | Exactly one booking succeeds; the other receives `SE001`; count equals capacity (1). Must be tested on MySQL/InnoDB, not SQLite. |
| E14 | Confirmed booking is more than 24 hours before slot start. | Patient chooses reschedule; system starts cancellation of old booking; patient creates and pays for a new booking. | Two independent bookings; old booking receives the early-cancel exam refund of 200,000; new booking pays 220,000 including a newly charged 20,000 service fee. |
| E15 | New patient account. | Create a child profile below the configured guardian age; attempt save without consent; record consent and save. | Guardian information is required; save without consent fails; one consent record exists; ID number and phone are masked in responses. Age threshold defaults to 16 pending policy verification. |
| E16 | Sample patient account. | Enter a wrong password five times within 60 seconds; try correct password while locked; wait 15 minutes. | Account becomes `locked` with `locked_until`; Sanctum tokens are revoked; response shows remaining lock duration; account unlocks after expiry; AU-02 and AU-03 are recorded. Use Laravel RateLimiter for the 60-second window unless a schema Change Request adds a window timestamp. |
| E17 | Three profiles: one with a pending booking, one with past booking history, one never booked. | Request deletion for each profile. | Pending booking blocks deletion with `EX-PRF-06`; profile with history is soft-deleted; never-booked profile is hard-deleted while consent and audit evidence remain. |
| E18 | Doctors and hospitals have coordinates. | User selects Nearby and denies location; selects a province/city; retries and grants location. | Denial falls back to province/city and specialty filters. Grant sorts by server-computed Haversine distance, default radius 5 km, selectable 2/5/10/20 km. |

## Sprint Outcome

Deliver seven end-to-end flows locally and integrate to `main` only after review:

1. Registration, login and RBAC.
2. Patient profiles and consent evidence.
3. Search filters and Nearby.
4. Doctor booking and approval.
5. Hospital booking and ticket/queue/QR.
6. Payment and refunds.
7. Admin demo, history and reports.

The original sprint dates (26/10/2026–01/11/2026) have passed. The team must set new dates and confirm each member's available hours before treating the seven-day estimate as a commitment.

## Work Split

| Owner | Scope | Acceptance |
|---|---|---|
| An | S4-01, 02, 04, 07, 08: migrations for 14 tables; five state enums; `config/medsi.php`; Asia/Ho_Chi_Minh; BookingStateMachine T01-T16; slot locking/counts; audit writes. | Migrations/seeder command succeeds on MySQL 8.0; valid/invalid transitions tested; E13 proves one winner and one `SE001`. Migration and E13 implementation are in the current branch; audit catalog mapping still needs alignment. |
| Công | S4-05, 06, 10-15, 35: scheduler for T03/T07/no-show; idempotency; AU-01..AU-20 AuditLogger; auth middleware/policies for patient/doctor/staff/admin; login rate limit/lock/token revoke; doctor account activation; Admin override paths. | E03, E06, E16. |
| Hiệu | S4-03, 20-25: Eloquent relationships/soft deletes and 14-table factories; profile CRUD, consent, masking, guardian validation, deletion policy and masked patient snapshot. | E15, E17. |
| Hoàng Huy | S4-30, 31, 33, 34, 36, 37: sample seed data; specialty/hospital/doctor/exam CRUD; Admin demo payment/approval; refund console; four reports. | Seed data supports E01-E18; E05, E06, E07, E12. |
| Hoài Bảo | S4-32, 40-45: doctor slot API/management; doctor booking rules and payment handoff; doctor approval/rejection; cancellation/refund requests. | E01 through approval, E05, E07, E09, E13, E14. |
| Tuấn Anh | S4-50-55: hospital slots and booking flow; ticket, queue and signed QR; scoped staff/Admin check-in; booking history/QR export. | E01 through check-in, E02. |
| Khôi | S4-60-65: server-side payment calculation; simulated gateway and idempotent transactions; refund policy/lifecycle; store-pay cutoff. | E04-E11 with exact amounts. |
| Quốc Huy | S4-70-74: connect frontend to real APIs; remove mock fallback on acceptance paths; booking/payment/history UI; Nearby and map. | E01, E02 and E18 on the real backend. |

## Cross-Team Gates

- **AU catalog:** Publish AU-01..AU-20 definitions, actor, trigger, sensitive-data rules and expected count before asserting AU-10/AU-11/AU-12/AU-14/AU-16.
- **Migration validation:** Run fresh migrations only on a dedicated local/CI test database. Confirm MySQL 8.0.16+ CHECK behavior, FK rules and ENUM values.
- **Concurrency:** E13 must use separate DB connections/processes on MySQL/InnoDB.
- **Authorization:** Doctor ownership and staff `hospital_id` scope must be enforced server-side, not only in UI.
- **No mock acceptance:** E2E pass requires real API/database calls; LocalStorage fallback is not an integration pass.
- **Traceability:** Record fixture IDs, event/audit expectations, test command and result for every accepted E01-E18.

## Safe Local Validation

From `backend/`, use a dedicated database named `medsi_test` only:

```bash
DB_DATABASE=medsi_test php artisan migrate:fresh --seed --force
php artisan test
RUN_MYSQL_CONCURRENCY_TESTS=1 DB_DATABASE=medsi_test php artisan test --filter=BookingConcurrencyTest
```

On PowerShell, set the environment variables for the command session before running Artisan. Never point `migrate:fresh` at a shared, staging or production database.
