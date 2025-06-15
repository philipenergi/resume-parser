# PDF Text Extractor Server

A Node.js server that extracts text content from PDF files for AI automation workflows, specifically designed for integration with Make.com.

## Features

- ✅ Extract text from uploaded PDF files
- ✅ Extract text from PDF URLs (perfect for Make.com webhooks)
- ✅ Comprehensive metadata extraction (pages, file info, word count)
- ✅ File size validation (10MB limit)
- ✅ CORS enabled for web integration
- ✅ Security headers with Helmet
- ✅ Automatic file cleanup
- ✅ Health check endpoints
- ✅ Detailed error handling

## Installation

1. **Install dependencies using pnpm:**

   ```bash
   pnpm install
   ```

2. **Start the server:**

   ```bash
   # Production
   pnpm start

   # Development (with auto-reload)
   pnpm run dev
   ```

3. **Server will be running on:**
   ```
   http://localhost:3000
   ```

## API Endpoints

### 1. Health Check

```http
GET /
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 2. Extract Text from Uploaded PDF

```http
POST /extract-text
Content-Type: multipart/form-data
```

**Parameters:**

- `pdf` (file): PDF file to process (max 10MB)

**Response:**

```json
{
  "success": true,
  "filename": "document.pdf",
  "fileSize": 1048576,
  "text": "Extracted text content...",
  "metadata": {
    "pages": 5,
    "info": {
      "Title": "Document Title",
      "Author": "Author Name"
    },
    "version": "1.4"
  },
  "extractedAt": "2024-01-01T00:00:00.000Z",
  "textLength": 1250,
  "wordCount": 200
}
```

### 3. Extract Text from PDF URL

```http
POST /extract-text-url
Content-Type: application/json
```

**Body:**

```json
{
  "url": "https://example.com/document.pdf",
  "filename": "document.pdf" // optional
}
```

**Response:** Same as above endpoint.

## Make.com Integration

### Method 1: File Upload

1. Create an HTTP module in Make.com
2. Set method to `POST`
3. Set URL to `YOUR_SERVER_URL/extract-text`
4. Add the PDF file in the request body as form-data with key `pdf`

### Method 2: URL Processing (Recommended)

1. Create an HTTP module in Make.com
2. Set method to `POST`
3. Set URL to `YOUR_SERVER_URL/extract-text-url`
4. Set Content-Type to `application/json`
5. Add JSON body:
   ```json
   {
     "url": "{{pdf_url_from_previous_module}}",
     "filename": "{{optional_filename}}"
   }
   ```

### Using the Extracted Text

The server returns the extracted text in the `text` field, which you can directly use in:

- OpenAI modules
- Claude AI modules
- Google Gemini modules
- Any other AI service in Make.com

## Example Usage

### Using cURL

**Upload PDF file:**

```bash
curl -X POST \
  -F "pdf=@/path/to/your/document.pdf" \
  http://localhost:3000/extract-text
```

**Process PDF from URL:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/document.pdf"}' \
  http://localhost:3000/extract-text-url
```

### Using JavaScript

```javascript
// Upload file
const formData = new FormData();
formData.append("pdf", pdfFile);

const response = await fetch("http://localhost:3000/extract-text", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log("Extracted text:", result.text);

// Process URL
const urlResponse = await fetch("http://localhost:3000/extract-text-url", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://example.com/document.pdf",
  }),
});

const urlResult = await urlResponse.json();
console.log("Extracted text:", urlResult.text);
```

## Environment Variables

Create a `.env` file for configuration:

```env
PORT=3000
NODE_ENV=production
```

## Error Handling

The server provides detailed error messages:

- **400 Bad Request**: Invalid file type, missing file, file too large
- **500 Internal Server Error**: PDF processing errors, network issues

Example error response:

```json
{
  "error": "Failed to extract text from PDF",
  "message": "File is not a valid PDF",
  "success": false
}
```

## File Size Limits

- Maximum file size: 10MB
- Supported format: PDF only
- Files are automatically cleaned up after processing

## Security Features

- Helmet.js for security headers
- CORS enabled for cross-origin requests
- File type validation
- File size limits
- Automatic file cleanup
- Input validation

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Run in production mode
pnpm start
```

## Troubleshooting

### Common Issues

1. **"Only PDF files are allowed!"**

   - Ensure the uploaded file is a valid PDF
   - Check the file extension and MIME type

2. **"File too large"**

   - PDF file exceeds 10MB limit
   - Compress the PDF or split into smaller files

3. **"Failed to fetch PDF"**
   - Check if the PDF URL is accessible
   - Ensure the URL returns a valid PDF file

### Logs

The server provides detailed console logs for debugging:

- File processing information
- Error details
- Request logging with Morgan

## License

MIT License - feel free to use this in your automation projects!
