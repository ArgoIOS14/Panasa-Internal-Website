# API Documentation

Both endpoints act as server-side proxies to Zoho Bigin CRM, keeping OAuth credentials off the client.

## Environment Variables

All variables are loaded from `src/api/.env` (see `.env.example` in the project root).

| Variable | Purpose |
|----------|---------|
| `ZOHO_CLIENT_ID` | OAuth client ID from Zoho API Console |
| `ZOHO_CLIENT_SECRET` | OAuth client secret |
| `ZOHO_REFRESH_TOKEN` | Long-lived refresh token for offline access |
| `ZOHO_ACCOUNTS_URL` | Zoho OAuth token endpoint (region-specific) |
| `ZOHO_BIGIN_API_URL` | Zoho Bigin Contacts API endpoint (region-specific) |

## Authentication Flow

Both endpoints use the same OAuth refresh-token flow:

1. Client JS sends `POST` to the proxy endpoint
2. Proxy exchanges the refresh token for a short-lived access token via `ZOHO_ACCOUNTS_URL`
3. Proxy uses the access token to create a Contact in Bigin via `ZOHO_BIGIN_API_URL`
4. Proxy returns the result to the client

Access tokens are not cached — a fresh token is requested per call.

---

## `POST /api/zoho-proxy.php`

Creates a contact in Zoho Bigin from the **contact form** on `/contact.html`.

### Request

```
Content-Type: application/json
```

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "(+44) 7911123456",
  "message": "We need help with card issuing."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `firstName` | string | yes | |
| `lastName` | string | yes | |
| `email` | string | yes | |
| `phone` | string | no | Sent with country code prefix; non-digit chars are stripped server-side |
| `message` | string | no | Mapped to `Description` in Bigin |

### Response — Success (200)

```json
{
  "status": "success",
  "message": "Contact created in Bigin"
}
```

### Response — Error (400 / 500)

```json
{
  "status": "error",
  "message": "Missing required fields"
}
```

```json
{
  "status": "error",
  "message": "Failed to create contact in Bigin",
  "details": { ... }
}
```

---

## `POST /api/zoho-email-proxy.php`

Creates a contact in Zoho Bigin from the **email capture popup**.

### Request

```
Content-Type: application/json
```

```json
{
  "email": "jane@example.com",
  "description": "Email capture – home page"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | yes | Validated server-side with `filter_var` |
| `description` | string | no | Defaults to `"Email capture"` |

The contact is created with `Last_Name` set to `"Email Subscriber"`.

### Response — Success (200)

```json
{
  "success": true,
  "message": "Contact created"
}
```

### Response — Error (400 / 502)

```json
{
  "error": "Valid email is required"
}
```

```json
{
  "error": "Failed to create contact",
  "details": { ... }
}
```

---

## CORS & Security

- Both endpoints validate the `Origin` header against an allowlist (`https://www.panasatech.com`, `http://localhost`). Requests from other origins receive a `403`.
- `Access-Control-Allow-Origin` is set to the validated origin (not `*`).
- Both support `OPTIONS` preflight requests.
- OAuth credentials are stored in `src/api/.env`, which is blocked from web access by `src/api/.htaccess`.

## Timeouts

| Endpoint | Token request | Bigin request |
|----------|--------------|---------------|
| `zoho-proxy.php` | 10 s | 10 s |
| `zoho-email-proxy.php` | 15 s | 15 s |

## Rate Limiting

No server-side rate limiting is implemented. Zoho Bigin's own API rate limits apply (see [Zoho API limits](https://www.zoho.com/bigin/developer/docs/api/api-limits.html)).
