# Nudge ERP — Integrations

## Gmail Integration (Phase 3)

### Overview
Gmail integration uses Google's OAuth 2.0 to access a user's mailbox for purchase order intake.

### Setup

1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable the Gmail API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials (Web Application type)
5. Add authorized redirect URI: `http://localhost:3000/api/v1/integrations/gmail/callback`
6. Set environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/integrations/gmail/callback
   ```

### Scopes
- `https://www.googleapis.com/auth/gmail.readonly` — Read-only access to messages and attachments

### Development Mode
When `GOOGLE_CLIENT_ID` is not set, the system uses a mock Gmail adapter. Manual file import (PDF, CSV, XLSX) is always available as a fallback.

### Workflow
1. User authorizes Gmail access via OAuth flow
2. System polls for new messages matching configured filters
3. Attachments are downloaded and queued for processing
4. AI extraction parses purchase order fields
5. User reviews and approves extracted data
6. Approved data creates a sales order

## AI Provider (Phase 3)

### Overview
AI-assisted document extraction for parsing purchase orders from PDFs and spreadsheets.

### Setup
```
AI_PROVIDER=openai   # or 'mock' for development
OPENAI_API_KEY=your_api_key
```

### Development Mode
When `AI_PROVIDER=mock`, the system returns deterministic test extraction results.

## Channel Adapters

### Architecture
Each sales channel (Blinkit, Zepto, Swiggy Instamart) uses an adapter interface:

```typescript
interface ChannelAdapter {
  importOrders(config: ChannelConfig): Promise<ImportResult>;
  mapSku(externalSku: string, orgId: string): Promise<Product | null>;
}
```

### Current Status
- **Manual CSV/XLSX import**: Available for all channels
- **API integration**: Requires merchant-specific API credentials (not available by default)
- **Email-based import**: Via Gmail integration

### Adding a New Channel
1. Implement the `ChannelAdapter` interface
2. Register in the adapter factory
3. Configure channel-specific SKU mappings
4. Test with sample data

## File Storage

Files are stored locally in the `uploads/` directory. File type and size validation is enforced (max 25MB by default).

For production, consider using cloud storage (S3, GCS) with the file storage adapter interface.
