/**
 * Test script for file extraction + OCR
 * Usage: node scripts/test-extract.js <path-to-file>
 * Example: node scripts/test-extract.js "C:/Users/Admin/Desktop/sample.pptx"
 */

import fs from 'node:fs';
import path from 'node:path';
import { FormData, Blob } from 'node:buffer';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/test-extract.js <path-to-file>');
  process.exit(1);
}

const BACKEND_URL = 'http://localhost:3000';
const absPath = path.resolve(filePath);

if (!fs.existsSync(absPath)) {
  console.error('File not found:', absPath);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(absPath);
const fileName = path.basename(absPath);
const formData = new FormData();
formData.append('file', new Blob([fileBuffer]), fileName);

console.log(`\n📄 Uploading: ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
console.log('─'.repeat(60));

const res = await fetch(`${BACKEND_URL}/api/extract-file`, {
  method: 'POST',
  body: formData
});

const data = await res.json();

if (data.error) {
  console.error('❌ Error:', data.error);
  process.exit(1);
}

console.log(`✅ Pages:       ${data.numpages}`);
console.log(`✅ Words:       ${data.words}`);
console.log(`✅ Domain:      ${data.domain}`);
console.log(`✅ Truncated:   ${data.truncated}`);
console.log(`✅ Images found: ${(data.images || []).length}`);
console.log('');

if (data.images && data.images.length > 0) {
  data.images.forEach((img, i) => {
    const ocrLen = (img.ocrText || '').length;
    const tier = ocrLen >= 30 ? '🟢 OCR (free)' : '🔴 Vision API needed';
    console.log(`  Image ${i + 1}: ${img.mimeType} | OCR chars: ${ocrLen} | ${tier}`);
    if (img.ocrText && img.ocrText.length > 0) {
      const preview = img.ocrText.substring(0, 120).replace(/\n/g, ' ');
      console.log(`           OCR preview: "${preview}${img.ocrText.length > 120 ? '…' : ''}"`);
    }
  });
} else {
  console.log('  No images found in this file.');
}

console.log('');
console.log('📝 Text preview (first 300 chars):');
console.log('─'.repeat(60));
console.log(data.text.substring(0, 300));
console.log('─'.repeat(60));
