// Simple test script for the PDF Text Extractor Server
// Run this after starting your server to test the endpoints

const BASE_URL = "http://localhost:3000";

async function testHealthCheck() {
  console.log("🏥 Testing health check endpoint...");
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log("✅ Health check successful:", data);
    return true;
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    return false;
  }
}

async function testPdfFromUrl() {
  console.log("🔗 Testing PDF extraction from URL...");
  try {
    // Using a sample PDF URL (you can replace with your own)
    const testUrl =
      "https://drive.google.com/file/d/1jLu9XEeSuW1OLVvwJc0AR9a-B3N-LAHx/view";

    const response = await fetch(`${BASE_URL}/extract-text-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: testUrl,
        filename: "test-document.pdf",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ PDF URL extraction successful!");
      console.log(`📄 Pages: ${data.metadata.pages}`);
      console.log(`📝 Text length: ${data.textLength} characters`);
      console.log(`🔢 Word count: ${data.wordCount} words`);
      console.log(`📋 Preview: ${data.text.substring(0, 100)}...`);
      return true;
    } else {
      const error = await response.json();
      console.error("❌ PDF URL extraction failed:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ PDF URL extraction error:", error.message);
    return false;
  }
}

async function testGoogleDriveUrl() {
  console.log("📄 Testing Google Drive PDF extraction...");
  try {
    // Test with the Google Drive URL you provided
    const testUrl =
      "https://drive.google.com/file/d/1O5HE9A5OLevbdZ3VxOFi5v3agcJOuMLk/view?usp=drive_link";

    const response = await fetch(`${BASE_URL}/extract-text-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: testUrl,
        filename: "google-drive-document.pdf",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Google Drive PDF extraction successful!");
      console.log(`📄 Pages: ${data.metadata.pages}`);
      console.log(`📝 Text length: ${data.textLength} characters`);
      console.log(`🔢 Word count: ${data.wordCount} words`);
      console.log(`📋 Preview: ${data.text.substring(0, 200)}...`);
      return true;
    } else {
      const error = await response.json();
      console.error("❌ Google Drive PDF extraction failed:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ Google Drive PDF extraction error:", error.message);
    return false;
  }
}

async function testHmacGeneration() {
  console.log("🔐 Testing HMAC-SHA512 signature generation...");
  try {
    const testData = "Hello, World! This is a test message.";
    const testSecret = "my-super-secret-key-2024";

    const response = await fetch(`${BASE_URL}/generate-hmac`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: testData,
        secret: testSecret,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ HMAC-SHA512 generation successful!");
      console.log(`🔐 Algorithm: ${result.algorithm}`);
      console.log(`📝 Data length: ${result.dataLength} characters`);
      console.log(`🔑 Signature: ${result.signature}`);
      console.log(`⏰ Generated at: ${result.generatedAt}`);
      return true;
    } else {
      const error = await response.json();
      console.error("❌ HMAC generation failed:", error);
      return false;
    }
  } catch (error) {
    console.error("❌ HMAC generation error:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting PDF Text Extractor Server Tests\n");

  const healthCheck = await testHealthCheck();
  console.log("");

  if (healthCheck) {
    // await testPdfFromUrl();
    console.log("");
    await testGoogleDriveUrl();
    console.log("");
    await testHmacGeneration();
  } else {
    console.log("⚠️  Skipping tests due to server connectivity issues");
  }

  console.log("\n✨ Tests completed!");
  console.log("\n📝 To test file upload, use:");
  console.log(
    'curl -X POST -F "pdf=@/path/to/your/file.pdf" http://localhost:3000/extract-text'
  );
  console.log("\n🔐 To test HMAC generation with curl, use:");
  console.log(
    'curl -X POST -H "Content-Type: application/json" -d \'{"data": "test message", "secret": "my-secret"}\' http://localhost:3000/generate-hmac'
  );
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testHealthCheck,
  testPdfFromUrl,
  testGoogleDriveUrl,
  testHmacGeneration,
};
