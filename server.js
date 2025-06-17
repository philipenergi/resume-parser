const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow PDF files
    if (
      file.mimetype === "application/pdf" ||
      path.extname(file.originalname).toLowerCase() === ".pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

// Utility function to clean up uploaded files
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error cleaning up file:", error);
  }
};

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "PDF Text Extractor Server is running",
    version: "1.0.0",
    endpoints: {
      "POST /extract-text": "Extract text from uploaded PDF file",
      "POST /extract-text-url": "Extract text from PDF URL",
      "POST /generate-hmac": "Generate HMAC-SHA512 signature",
      "GET /health": "Health check endpoint",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Main PDF text extraction endpoint
app.post("/extract-text", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No PDF file uploaded",
        message: 'Please upload a PDF file using the "pdf" field',
      });
    }

    const filePath = req.file.path;
    console.log(`Processing PDF: ${req.file.originalname}`);

    // Read and parse the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // Extract metadata and text
    const result = {
      success: true,
      filename: req.file.originalname,
      fileSize: req.file.size,
      text: pdfData.text,
      metadata: {
        pages: pdfData.numpages,
        info: pdfData.info || {},
        version: pdfData.version || "Unknown",
      },
      extractedAt: new Date().toISOString(),
      textLength: pdfData.text.length,
      wordCount: pdfData.text.split(/\s+/).filter((word) => word.length > 0)
        .length,
    };

    // Clean up the uploaded file
    cleanupFile(filePath);

    res.json(result);
  } catch (error) {
    console.error("PDF processing error:", error);

    // Clean up file if it exists
    if (req.file && req.file.path) {
      cleanupFile(req.file.path);
    }

    res.status(500).json({
      error: "Failed to extract text from PDF",
      message: error.message,
      success: false,
    });
  }
});

// Utility function to convert Google Drive sharing links to direct download links
const convertGoogleDriveUrl = (url) => {
  // Check if it's a Google Drive sharing link
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);

  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url; // Return original URL if not a Google Drive link
};

// Extract text from PDF via URL (for Make.com webhooks)
app.post("/extract-text-url", async (req, res) => {
  try {
    const { url, filename } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "No PDF URL provided",
        message: 'Please provide a "url" field with the PDF URL',
      });
    }

    // Convert Google Drive sharing links to direct download links
    const processedUrl = convertGoogleDriveUrl(url);
    console.log(`Processing PDF from URL: ${url}`);
    if (processedUrl !== url) {
      console.log(`🔄 Converted Google Drive URL to: ${processedUrl}`);
    }

    // Fetch PDF from URL
    const response = await fetch(processedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const dataBuffer = Buffer.from(arrayBuffer);

    // Parse the PDF
    const pdfData = await pdfParse(dataBuffer);

    const result = {
      success: true,
      filename: filename || "Unknown",
      url: url,
      text: pdfData.text,
      metadata: {
        pages: pdfData.numpages,
        info: pdfData.info || {},
        version: pdfData.version || "Unknown",
      },
      extractedAt: new Date().toISOString(),
      textLength: pdfData.text.length,
      wordCount: pdfData.text.split(/\s+/).filter((word) => word.length > 0)
        .length,
    };

    res.json(result);
  } catch (error) {
    console.error("PDF URL processing error:", error);

    res.status(500).json({
      error: "Failed to extract text from PDF URL",
      message: error.message,
      success: false,
    });
  }
});

// HMAC-SHA512 signature generation endpoint
app.post("/generate-hmac", async (req, res) => {
  try {
    const { data, secret } = req.body;

    // Validate input
    if (!data) {
      return res.status(400).json({
        error: "Missing data parameter",
        message: 'Please provide a "data" field with the data to sign',
        success: false,
      });
    }

    if (!secret) {
      return res.status(400).json({
        error: "Missing secret parameter",
        message: 'Please provide a "secret" field with the signing key',
        success: false,
      });
    }

    // Generate HMAC-SHA512 signature
    const hmac = crypto.createHmac("sha512", secret);
    hmac.update(data);
    const signature = hmac.digest("hex");

    const result = {
      success: true,
      data: data,
      signature: signature,
      algorithm: "HMAC-SHA512",
      generatedAt: new Date().toISOString(),
      dataLength: data.length,
    };

    console.log(
      `Generated HMAC-SHA512 signature for data of length: ${data.length}`
    );

    res.json(result);
  } catch (error) {
    console.error("HMAC generation error:", error);

    res.status(500).json({
      error: "Failed to generate HMAC signature",
      message: error.message,
      success: false,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large",
        message: "PDF file size must be less than 10MB",
      });
    }
  }

  if (error.message === "Only PDF files are allowed!") {
    return res.status(400).json({
      error: "Invalid file type",
      message: "Only PDF files are allowed",
    });
  }

  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong processing your request",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Text Extractor Server running on port ${PORT}`);
  console.log(`📄 Ready to process PDF files for AI automation!`);
  console.log(`🔗 Access the server at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
