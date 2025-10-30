# VibeDocs API Documentation

## Overview

The VibeDocs API allows you to programmatically create and manage documents and links at scale. This is perfect for integrating with email sequences, automation tools, and custom workflows.

## Architecture

VibeDocs separates **Documents** and **Links** as distinct entities:

- **Document**: The uploaded file with universal settings (filename, display mode, folder)
- **Link**: A shareable link to a document with unique settings (password, expiration, receiver page customization, etc.)

This architecture allows you to:
1. Upload a document once
2. Create multiple links for different recipients with different settings
3. Track views and analytics per link
4. Customize the viewer experience for each link

## Base URL

```
https://your-domain.com/api/v1
```

## Authentication

All API requests require authentication using an API key. Include your API key in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

### Generating an API Key

1. Go to your account settings at `/account?tab=api-keys`
2. Enter a name for your API key (e.g., "Production API Key")
3. Click "Create API Key"
4. **Important**: Copy the API key immediately - it will only be shown once!

## Endpoints

### 1. Create a Document

Upload a document to VibeDocs. This document can then be used to create multiple links.

**Endpoint**: `POST /api/v1/documents`

**Required Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body**:

```json
{
  // Required
  "filename": "Q4 Pitch Deck.pdf",
  "fileUrl": "https://your-storage.com/signed-url-to-file.pdf",

  // Optional
  "displayMode": "auto",  // "auto" | "slideshow" | "document" (applies to all links)
  "folderId": "uuid-of-folder",
  "fileSize": 1048576,  // Size in bytes
  "mimeType": "application/pdf"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "document": {
    "id": "doc-uuid-here",
    "filename": "Q4 Pitch Deck.pdf",
    "displayMode": "auto",
    "folderId": null,
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "createdAt": "2024-12-20T10:30:00Z"
  }
}
```

---

### 2. List Documents

Get all your uploaded documents with link counts.

**Endpoint**: `GET /api/v1/documents`

**Query Parameters**:
- `folderId` (optional): Filter by folder
- `limit` (optional): Number of documents to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response** (200 OK):

```json
{
  "success": true,
  "documents": [
    {
      "id": "doc-uuid",
      "filename": "Q4 Pitch Deck.pdf",
      "displayMode": "auto",
      "folderId": null,
      "fileSize": 1048576,
      "mimeType": "application/pdf",
      "createdAt": "2024-12-20T10:30:00Z",
      "updatedAt": "2024-12-20T10:30:00Z",
      "linkCount": 3
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

---

### 3. Create a Link

Create a shareable link for a document with customized settings.

**Endpoint**: `POST /api/v1/links`

**Required Headers**:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body**:

```json
{
  // Required - reference to document
  "documentId": "doc-uuid-here",

  // Optional security settings (link-specific)
  "password": "optional-password",
  "expires": "2025-12-31T23:59:59Z",

  // Optional access settings (link-specific)
  "allowDownload": true,
  "requireEmail": true,
  "requireSignature": false,
  "sendNotifications": true,

  // Optional receiver page customization (link-specific)
  "viewerPageHeading": "Q4 2024 Pitch Deck for Acme Ventures",
  "viewerPageSubheading": "Series A Fundraising",
  "viewerPageCoverLetter": "Dear John,\n\nThank you for your interest...",
  "viewerPageLogoUrl": "https://your-storage.com/logo.png",
  "signatureInstructions": "Please sign to confirm",
  "coverLetterFont": "cursive",
  "coverLetterColor": "gray-800",
  "showCreatorSignature": false,

  // Optional folder (can be different from document's folder)
  "folderId": "uuid-of-folder"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "link": {
    "id": "link-uuid",
    "shareUrl": "https://your-domain.com/links/view/link-uuid",
    "documentId": "doc-uuid",
    "documentFilename": "Q4 Pitch Deck.pdf",
    "createdAt": "2024-12-20T10:30:00Z",
    "expires": "2025-12-31T23:59:59Z",
    "allowDownload": true,
    "requireEmail": true,
    "requireSignature": false,
    "folderId": null
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid or missing API key
- `404 Not Found`: Document or folder not found
- `500 Internal Server Error`: Server error

---

### 4. List Links

Retrieve a list of your links with pagination support.

**Endpoint**: `GET /api/v1/links`

**Query Parameters**:
- `folderId` (optional): Filter links by folder ID
- `limit` (optional): Number of links to return (default: 50, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Example Request**:
```
GET /api/v1/links?folderId=uuid&limit=20&offset=0
Authorization: Bearer YOUR_API_KEY
```

**Response** (200 OK):

```json
{
  "success": true,
  "links": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "Q4 Pitch Deck.pdf",
      "created_at": "2024-12-20T10:30:00Z",
      "expires": "2025-12-31T23:59:59Z",
      "allow_download": true,
      "require_email": true,
      "folder_id": null,
      "viewer_page_heading": "Q4 2024 Pitch Deck",
      "shareUrl": "https://your-domain.com/links/view/550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 20
  }
}
```

---

### 3. List Folders

Get all your folders for organizing links.

**Endpoint**: `GET /api/v1/folders`

**Example Request**:
```
GET /api/v1/folders
Authorization: Bearer YOUR_API_KEY
```

**Response** (200 OK):

```json
{
  "success": true,
  "folders": [
    {
      "id": "folder-uuid-1",
      "name": "Investor Decks",
      "color": "#6B7280",
      "created_at": "2024-12-20T10:00:00Z",
      "updated_at": "2024-12-20T10:00:00Z"
    },
    {
      "id": "folder-uuid-2",
      "name": "Customer Proposals",
      "color": "#3B82F6",
      "created_at": "2024-12-19T15:30:00Z",
      "updated_at": "2024-12-19T15:30:00Z"
    }
  ]
}
```

---

### 4. Create a Folder

Create a new folder to organize your links.

**Endpoint**: `POST /api/v1/folders`

**Request Body**:

```json
{
  "name": "Investor Decks",
  "color": "#6B7280"  // Hex color code (optional, default: #6B7280)
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "folder": {
    "id": "folder-uuid",
    "name": "Investor Decks",
    "color": "#6B7280",
    "createdAt": "2024-12-20T10:00:00Z"
  }
}
```

**Error Responses**:
- `409 Conflict`: Folder with this name already exists

---

## Code Examples

### Node.js / JavaScript

```javascript
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://your-domain.com/api/v1';

// Step 1: Create a document
async function createDocument() {
  const response = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: 'Q4 Pitch Deck.pdf',
      fileUrl: 'https://your-storage.com/file.pdf',
      displayMode: 'slideshow',  // All links will use slideshow mode
      folderId: 'your-folder-id' // optional
    })
  });

  const data = await response.json();
  console.log('Document created:', data.document.id);
  return data.document;
}

// Step 2: Create multiple links for the same document
async function createLinksForRecipients(documentId, recipients) {
  const links = [];

  for (const recipient of recipients) {
    const response = await fetch(`${BASE_URL}/links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: documentId,
        requireEmail: true,
        viewerPageHeading: `Q4 2024 Pitch Deck for ${recipient.company}`,
        viewerPageCoverLetter: `Dear ${recipient.name},\n\nThank you for your interest...`,
        password: recipient.password, // optional, per-recipient password
        expires: '2025-12-31T23:59:59Z'
      })
    });

    const data = await response.json();
    links.push({
      recipient: recipient.email,
      shareUrl: data.link.shareUrl
    });
  }

  return links;
}

// Complete workflow
async function sendPersonalizedDecks() {
  // Upload document once
  const document = await createDocument();

  // Create personalized links for each recipient
  const recipients = [
    { name: 'John', company: 'Acme Ventures', email: 'john@acme.com' },
    { name: 'Jane', company: 'Beta Capital', email: 'jane@beta.com' }
  ];

  const links = await createLinksForRecipients(document.id, recipients);

  // Now send emails with personalized links
  for (const link of links) {
    await sendEmail(link.recipient, link.shareUrl);
  }
}

// List all documents
async function listDocuments() {
  const response = await fetch(`${BASE_URL}/documents?limit=50`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await response.json();
  return data.documents;
}

// List all links
async function listLinks() {
  const response = await fetch(`${BASE_URL}/links?limit=50`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  const data = await response.json();
  return data.links;
}
```

### Python

```python
import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://your-domain.com/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Create a link
def create_link():
    payload = {
        'filename': 'Q4 Pitch Deck.pdf',
        'fileUrl': 'https://your-storage.com/file.pdf',
        'requireEmail': True,
        'viewerPageHeading': 'Q4 2024 Pitch Deck',
        'viewerPageCoverLetter': 'Thank you for reviewing our deck!',
        'folderId': 'your-folder-id'  # optional
    }

    response = requests.post(
        f'{BASE_URL}/links',
        headers=headers,
        json=payload
    )

    data = response.json()
    print(f"Share URL: {data['link']['shareUrl']}")
    return data

# List links
def list_links():
    response = requests.get(
        f'{BASE_URL}/links?limit=50',
        headers=headers
    )

    data = response.json()
    return data['links']
```

### cURL

```bash
# Create a link
curl -X POST https://your-domain.com/api/v1/links \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "Q4 Pitch Deck.pdf",
    "fileUrl": "https://your-storage.com/file.pdf",
    "requireEmail": true,
    "viewerPageHeading": "Q4 2024 Pitch Deck",
    "viewerPageCoverLetter": "Thank you for reviewing our deck!"
  }'

# List links
curl https://your-domain.com/api/v1/links?limit=50 \
  -H "Authorization: Bearer YOUR_API_KEY"

# Create a folder
curl -X POST https://your-domain.com/api/v1/folders \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Investor Decks",
    "color": "#6B7280"
  }'
```

---

## Use Cases

### 1. Email Sequence Integration

Create one document, then generate personalized links for each recipient:

```javascript
// Upload document once
const document = await createDocument({
  filename: 'Q4 Pitch Deck.pdf',
  fileUrl: await uploadToStorage(pdfFile),
  displayMode: 'slideshow'
});

// Create personalized links for each recipient
for (const recipient of emailList) {
  const link = await createLink({
    documentId: document.id,
    viewerPageHeading: `Pitch Deck for ${recipient.company}`,
    viewerPageCoverLetter: `Dear ${recipient.name},\n\nThank you for your interest...`,
    requireEmail: true,
    password: generateUniquePassword(recipient) // optional per-recipient security
  });

  await sendEmail(recipient.email, {
    shareUrl: link.shareUrl,
    password: link.password
  });
}
```

### 2. Bulk Link Creation with Folders

Upload once, create multiple organized links:

```javascript
// Create folder for campaign
const folder = await createFolder({ name: 'Q4 2024 Fundraising', color: '#3B82F6' });

// Upload document
const document = await createDocument({
  filename: 'Pitch Deck.pdf',
  fileUrl: signedPdfUrl,
  displayMode: 'slideshow',
  folderId: folder.id
});

// Create personalized links in same folder
const links = await Promise.all(
  investors.map(investor => createLink({
    documentId: document.id,
    folderId: folder.id,
    viewerPageHeading: `Pitch Deck for ${investor.company}`,
    requireEmail: true
  }))
);
```

### 3. Multi-Version Document Sharing

Share different versions with different groups:

```javascript
// Upload final version
const finalDoc = await createDocument({
  filename: 'Pitch Deck - Final.pdf',
  fileUrl: finalVersionUrl,
  displayMode: 'slideshow'
});

// Create link for investors (with restrictions)
const investorLink = await createLink({
  documentId: finalDoc.id,
  requireEmail: true,
  allowDownload: false,
  expires: '2025-01-31T23:59:59Z'
});

// Create link for advisors (more permissive)
const advisorLink = await createLink({
  documentId: finalDoc.id,
  requireEmail: true,
  allowDownload: true,
  password: 'advisor-password'
});

// Same document, different access controls per link!
```

### 4. Document Tracking Per Recipient

Track views and signatures per link:

```javascript
// Upload NDA document
const ndaDoc = await createDocument({
  filename: 'NDA.pdf',
  fileUrl: ndaUrl,
  displayMode: 'document'
});

// Create unique link for each potential hire
for (const candidate of candidates) {
  const link = await createLink({
    documentId: ndaDoc.id,
    requireEmail: true,
    requireSignature: true,
    signatureInstructions: `Please review and sign to proceed with ${candidate.role} interview`,
    viewerPageHeading: `${company} Non-Disclosure Agreement`
  });

  await sendEmail(candidate.email, {
    shareUrl: link.shareUrl
  });
}

// Later, check which candidates have signed
const links = await listLinks();
for (const link of links) {
  const analytics = await fetch(`/analytics/${link.id}`);
  console.log(`${link.viewerPageHeading}: ${analytics.signatures} signatures`);
}
```

---

## Rate Limiting

- **Rate Limit**: 100 requests per minute per API key
- **Burst**: Up to 20 requests in a 1-second window

If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

---

## Best Practices

1. **Store your API key securely**: Never commit API keys to version control
2. **Use environment variables**: Store API keys in environment variables
3. **Handle errors gracefully**: Always check response status and handle errors
4. **Use folders**: Organize links into folders for better management
5. **Set expiration dates**: Set expiration dates for time-sensitive documents
6. **Monitor usage**: Check the `last_used_at` field in your API keys tab

---

## Security

- API keys are hashed before storage
- API keys can be deactivated without deletion
- Each key tracks last usage time
- Keys can have optional expiration dates

---

## Support

For API support or questions:
- Email: support@vibedocs.com
- Documentation: https://docs.vibedocs.com
- GitHub: https://github.com/your-repo

---

## Changelog

### v1.0.0 (2024-12-20)
- Initial API release
- Link creation and management endpoints
- Folder management endpoints
- API key authentication
