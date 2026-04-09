@@ -0,0 +1,128 @@

# i18n Error Key Reference

All API error responses include an `error_key` field with a stable `SCREAMING_SNAKE_CASE` identifier.
Frontend can map this key to a localized string.

## JavaScript Mapping Example

```js
// "INVALID_SIGNATURE" → "backend.invalidSignature"
const toI18nKey = (key) =>
  "backend." +
  key.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
```

## Response Format

**Error response:**

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid signature",
  "error_key": "INVALID_SIGNATURE",
  "data": null
}
```

**Success response** — `error_key` is omitted:

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": { ... }
}
```

---

## Error Key Table

### Request / Validation

| Key                       | English Default          | HTTP |
| ------------------------- | ------------------------ | ---- |
| `INVALID_REQUEST_BODY`    | Invalid request body     | 400  |
| `INVALID_QUERY_PARAMS`    | Invalid query parameters | 400  |
| `INVALID_REQUEST_PAYLOAD` | Invalid request payload  | 400  |

### Common Field Validation

| Key                  | English Default       | HTTP |
| -------------------- | --------------------- | ---- |
| `EVENT_ID_REQUIRED`  | event_id is required  | 400  |
| `UNLOCK_ID_REQUIRED` | unlock_id is required | 400  |
| `PLAN_ID_REQUIRED`   | plan_id is required   | 400  |
| `INVALID_EVENT_ID`   | invalid event_id      | 400  |
| `INVALID_PLAN_ID`    | invalid plan_id       | 400  |
| `INVALID_REPLY_ID`   | invalid reply id      | 400  |
| `INVALID_ID`         | Invalid id            | 400  |
| `CODE_REQUIRED`      | code is required      | 400  |

### Not Found

| Key                          | English Default            | HTTP |
| ---------------------------- | -------------------------- | ---- |
| `EVENT_NOT_FOUND`            | Event not found            | 404  |
| `EVENT_OR_DEPOSIT_NOT_FOUND` | Event or deposit not found | 404  |
| `UNLOCK_RECORD_NOT_FOUND`    | Unlock record not found    | 404  |
| `RECEIPT_NOT_FOUND`          | receipt not found          | 404  |
| `VERIFICATION_CSV_NOT_FOUND` | verification csv not found | 404  |

### Reply / Vote Flow

| Key                                 | English Default                                            | HTTP |
| ----------------------------------- | ---------------------------------------------------------- | ---- |
| `PLAINTEXT_TIMEOUT`                 | plaintext time out                                         | 400  |
| `INVALID_SIGNATURE`                 | Invalid signature                                          | 400  |
| `ONLY_ONGOING_EVENTS_ALLOW_REPLIES` | only ongoing events allow replies                          | 400  |
| `OPTION_OR_CONTENT_REQUIRED`        | either option_id or content must be provided               | 400  |
| `OPTION_NOT_BELONG_TO_EVENT`        | option does not belong to this event                       | 400  |
| `INVALID_REFERRAL_CODE`             | invalid referral code                                      | 400  |
| `ADDRESS_BALANCE_ZERO`              | address balance must be greater than 0                     | 400  |
| `DAILY_REPLY_LIMIT_EXCEEDED`        | daily reply limit exceeded (3 replies per day per address) | 400  |
| `REPLIES_LOCKED`                    | locked                                                     | 403  |

> `REPLIES_LOCKED` uses HTTP code `403` and response code `403101`.

### Event Management

| Key                                | English Default                                                  | HTTP |
| ---------------------------------- | ---------------------------------------------------------------- | ---- |
| `EVENT_EDIT_ONLY_IN_PREHEAT`       | event can only be edited when in preheat status                  | 400  |
| `PAYLOAD_NOT_MATCH_SIGNED_CONTENT` | payload does not match signed content                            | 400  |
| `OPEN_EVENT_RESULT_VISIBILITY`     | open events are not allowed when result_visibility is not public | 400  |
| `CREATOR_ADDRESS_REQUIRED`         | creator address is required                                      | 400  |
| `INVALID_CREATOR_ADDRESS`          | invalid creator address                                          | 400  |

### Deposit / Extend

| Key                               | English Default                             | HTTP |
| --------------------------------- | ------------------------------------------- | ---- |
| `DEPOSIT_NOT_ELIGIBLE_FOR_EXTEND` | deposit status not eligible for extend      | 400  |
| `REMAINING_TIME_TOO_LONG`         | remaining time must be less than 30 minutes | 400  |

### Rate Limiting

| Key                   | English Default     | HTTP |
| --------------------- | ------------------- | ---- |
| `RATE_LIMIT_EXCEEDED` | rate limit exceeded | 429  |

### Admin Authentication

| Key                             | English Default                    | HTTP |
| ------------------------------- | ---------------------------------- | ---- |
| `INVALID_ADDRESS`               | invalid address                    | 401  |
| `ADMIN_ACCOUNT_INACTIVE`        | admin account is inactive          | 401  |
| `HASH_KEY_MISMATCH_OR_EXPIRED`  | Hash key mismatch or expired       | 400  |
| `SIGNATURE_VERIFICATION_FAILED` | Signature verification failed      | 400  |
| `ADMIN_ADDRESS_MISMATCH`        | Admin address does not match token | 400  |

### Admin CRUD

| Key                                   | English Default                             | HTTP |
| ------------------------------------- | ------------------------------------------- | ---- |
| `REFERRAL_CODE_ALREADY_EXISTS`        | Referral code already exists                | 400  |
| `REFERRAL_CODE_NOT_FOUND_OR_INACTIVE` | Referral code not found or already inactive | 404  |
| `REFERRAL_CODE_NOT_FOUND`             | Referral code not found                     | 404  |
| `SYSTEM_PARAMETERS_NOT_CONFIGURED`    | System parameters not configured            | 404  |
