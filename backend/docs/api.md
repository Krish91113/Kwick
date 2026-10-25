# KwickDrop — API Documentation (v1)

**Product:** KwickDrop  
**Tagline:** Drop it. Scan it. Share it.  
**Brand:** Built by Krish  
**Base URL:** `/api/v1` (or configured `PUBLIC_APP_URL/api/v1`)  

---

## 1. Overview & Conventions

- **Content-Type**: Requests with bodies must send `application/json` or `multipart/form-data` for file uploads.
- **Request Tracing**: Every response includes an `X-Request-Id` HTTP header and a matching `"requestId"` field in the JSON body.
- **Standard Success Response Envelope**:
```json
{
  "success": true,
  "data": { ... },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```
- **Standard Error Response Envelope**:
```json
{
  "success": false,
  "error": {
    "code": "SHARE_EXPIRED",
    "message": "This share has expired.",
    "details": []
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

---

## 2. Health & Readiness Endpoints

### 2.1 Process Health
Check server uptime and basic process liveness.

- **Method**: `GET`
- **Path**: `/health`
- **Rate Limit**: General limiter (100 req / 15m)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 1420,
    "timestamp": "2026-10-25T16:45:00.000Z"
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

### 2.2 Database Readiness
Verify active database connectivity for deploy orchestrators and monitoring.

- **Method**: `GET`
- **Path**: `/ready`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "database": "connected",
    "timestamp": "2026-10-25T16:45:00.000Z"
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

**Response (503 Service Unavailable)**:
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database service is not ready."
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

---

## 3. Text and Code Sharing

### 3.1 Create Text Share
Create a temporary anonymous text or code share.

- **Method**: `POST`
- **Path**: `/api/v1/shares`
- **Rate Limit**: 20 creations per hour per IP
- **Request Body**:
```json
{
  "title": "Database Migration Script",
  "textContent": "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;",
  "language": "sql",
  "expiresIn": "24h"
}
```
- **Allowed `language` values**: `plaintext`, `javascript`, `typescript`, `python`, `html`, `css`, `json`, `markdown`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `sql`, `bash`, `shell`, `yaml`, `xml`, `php`, `ruby`, `dockerfile`.
- **Allowed `expiresIn` values**: `'1h'`, `'24h'`, `'7d'` (default: `'24h'`).
- **Maximum payload**: 100 KB.

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "shareId": "kd_87f2ab99014b2d184a5e",
    "shortCode": "kd93xf",
    "type": "text",
    "title": "Database Migration Script",
    "textContent": "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;",
    "language": "sql",
    "shareUrl": "https://kwickdrop.vercel.app/s/kd_87f2ab99014b2d184a5e",
    "qrUrl": "https://kwickdrop.vercel.app/s/kd_87f2ab99014b2d184a5e",
    "contentUrl": "https://kwickdrop-api.onrender.com/api/v1/shares/kd_87f2ab99014b2d184a5e/content",
    "createdAt": "2026-10-25T16:00:00.000Z",
    "expiresAt": "2026-10-26T16:00:00.000Z",
    "status": "active",
    "viewCount": 0,
    "downloadCount": 0,
    "deleteToken": "a3f91d8...64-char-hex-secret..."
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```
> **Security Note**: `deleteToken` is returned **only once** upon creation. Save it to delete the share early if required.

---

### 3.2 Retrieve Share Metadata & Content
Retrieve share details by unique `shareId`.

- **Method**: `GET`
- **Path**: `/api/v1/shares/:shareId`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "shareId": "kd_87f2ab99014b2d184a5e",
    "shortCode": "kd93xf",
    "type": "text",
    "title": "Database Migration Script",
    "textContent": "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;",
    "language": "sql",
    "shareUrl": "https://kwickdrop.vercel.app/s/kd_87f2ab99014b2d184a5e",
    "qrUrl": "https://kwickdrop.vercel.app/s/kd_87f2ab99014b2d184a5e",
    "contentUrl": "https://kwickdrop-api.onrender.com/api/v1/shares/kd_87f2ab99014b2d184a5e/content",
    "createdAt": "2026-10-25T16:00:00.000Z",
    "expiresAt": "2026-10-26T16:00:00.000Z",
    "status": "active",
    "viewCount": 1,
    "downloadCount": 0
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

**Response (410 Gone / Expired)**:
```json
{
  "success": false,
  "error": {
    "code": "SHARE_EXPIRED",
    "message": "This share has expired."
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

---

### 3.3 Retrieve Raw Share Content
Stream the raw content of the text share.

- **Method**: `GET`
- **Path**: `/api/v1/shares/:shareId/content`
- **Content-Type**: `text/plain; charset=utf-8`

**Response (200 OK)**:
Raw string contents without JSON envelope.

---

### 3.4 Resolve Short Code
Lookup a share via human-friendly short code (e.g., for QR scanning or manual input).

- **Method**: `GET`
- **Path**: `/api/v1/s/:shortCode` or `/s/:shortCode`
- **Rate Limit**: 60 requests per minute per IP

**Response (200 OK)**:
Returns identical metadata structure as `/api/v1/shares/:shareId`.

---

## 4. File Sharing & Downloads

### 4.1 Upload and Create File Share
Upload a single file up to 10 MB.

- **Method**: `POST`
- **Path**: `/api/v1/shares/file`
- **Rate Limit**: 5 uploads per hour per IP (FR-02)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (Binary file stream) **[Required]**
  - `title`: (string, optional)
  - `expiresIn`: (string: `'1h'`, `'24h'`, or `'7d'`, optional, default: `'24h'`)
- **Allowed Formats**:
  - Images: PNG, JPG, JPEG, GIF, WEBP
  - Documents: PDF, TXT, MD, CSV, JSON, ZIP
- **Prohibited Formats**:
  - `.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, `.js`, `.msi`, `.jar`, `.html`, `.svg` and all executable/script binaries.

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "shareId": "kd_f40b2891d09e4a8b79c3",
    "shortCode": "k4j9m2",
    "type": "file",
    "title": "quarterly_report.pdf",
    "file": {
      "originalName": "quarterly_report.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 1048576
    },
    "shareUrl": "https://kwickdrop.vercel.app/s/kd_f40b2891d09e4a8b79c3",
    "qrUrl": "https://kwickdrop.vercel.app/s/kd_f40b2891d09e4a8b79c3",
    "contentUrl": "https://kwickdrop-api.onrender.com/api/v1/shares/kd_f40b2891d09e4a8b79c3/content",
    "downloadUrl": "https://kwickdrop-api.onrender.com/api/v1/shares/kd_f40b2891d09e4a8b79c3/download",
    "createdAt": "2026-10-25T16:00:00.000Z",
    "expiresAt": "2026-10-26T16:00:00.000Z",
    "status": "active",
    "viewCount": 0,
    "downloadCount": 0,
    "deleteToken": "b4791e...64-char-hex..."
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

---

### 4.2 Authorize and Download File
Authorize file download with enforced expiry and strict security headers.

- **Method**: `GET`
- **Path**: `/api/v1/shares/:shareId/download`

**Response Headers**:
- `Content-Disposition`: `attachment; filename="sanitized_name.ext"; filename*=UTF-8''...`
- `Content-Type`: `application/pdf` (or corresponding MIME type)
- `X-Content-Type-Options`: `nosniff`
- `Content-Security-Policy`: `default-src 'none'`

---

### 4.3 Delete Share with Capability Token
Permanently delete a share and remove its asset from Cloudinary.

- **Method**: `DELETE`
- **Path**: `/api/v1/shares/:shareId` or `/api/v1/shares/:shareId/file`
- **Headers / Query / Body**:
  - Header: `X-Delete-Token: <your-delete-token>`
  - Or query param: `?token=<your-delete-token>`
  - Or body: `{ "deleteToken": "<your-delete-token>" }`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "shareId": "kd_f40b2891d09e4a8b79c3",
    "message": "Share deleted successfully."
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid deletion capability token."
  },
  "requestId": "9c8e1f57-8149-43c2-bd83-df81a5c43d78"
}
```

---

## 5. Error Code Reference

| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body or parameters failed schema validation |
| 400 | `BAD_REQUEST` | Malformed input or missing parameters |
| 400 | `MISSING_FILE` | File sharing endpoint invoked without attached file |
| 400 | `MIME_MISMATCH` | Detected binary signature does not match declared extension |
| 401 | `UNAUTHORIZED` | Invalid or missing deletion capability token |
| 404 | `SHARE_NOT_FOUND` | Share does not exist or has been deleted |
| 404 | `SHORT_CODE_NOT_FOUND`| Short code does not correspond to an active share |
| 410 | `SHARE_EXPIRED` | Share has passed its expiration timestamp |
| 413 | `FILE_TOO_LARGE` | Uploaded file exceeds the 10 MB maximum limit |
| 413 | `PAYLOAD_TOO_LARGE` | Text share exceeds the 100 KB limit |
| 415 | `UNSUPPORTED_MEDIA_TYPE`| Dangerous format or extension not allowlisted |
| 429 | `RATE_LIMIT_EXCEEDED` | Request rate exceeded general or creation threshold |
| 429 | `UPLOAD_RATE_LIMIT_EXCEEDED` | Exceeded 5 uploads per hour rate limit |
| 500 | `INTERNAL_ERROR` | Unexpected server failure |
| 503 | `SERVICE_UNAVAILABLE` | Database readiness probe failed |
