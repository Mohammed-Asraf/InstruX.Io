import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { getOpenAI } from '../../../lib/ai.js';

// Zero-dependency PDF image extractor — scans binary for embedded JPEG/PNG streams.
// Covers scanned PDFs (JPEG pages) and PDFs with embedded images.
function extractPdfImages(buffer) {
  const images = [];

  // --- JPEG: scan for FF D8 FF ... FF D9 ---
  let i = 0;
  while (i < buffer.length - 2) {
    if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
      // Found JPEG start — find its end marker FF D9
      let end = -1;
      for (let j = i + 3; j < buffer.length - 1; j++) {
        if (buffer[j] === 0xFF && buffer[j + 1] === 0xD9) { end = j + 2; break; }
      }
      if (end !== -1 && end - i > 500) { // skip tiny artefacts < 500 bytes
        images.push({ base64: buffer.slice(i, end).toString('base64'), mimeType: 'image/jpeg' });
        i = end;
        continue;
      }
    }
    i++;
  }

  // --- PNG: scan for 89 50 4E 47 ... 49 45 4E 44 AE 42 60 82 (IEND chunk) ---
  let p = 0;
  while (p < buffer.length - 8) {
    if (buffer[p] === 0x89 && buffer[p+1] === 0x50 && buffer[p+2] === 0x4E && buffer[p+3] === 0x47) {
      // PNG magic — find IEND marker
      let end = -1;
      for (let q = p + 8; q < buffer.length - 7; q++) {
        // IEND chunk type bytes: 0x49 0x45 0x4E 0x44 followed by CRC (4 bytes)
        if (buffer[q] === 0x49 && buffer[q+1] === 0x45 && buffer[q+2] === 0x4E && buffer[q+3] === 0x44) {
          end = q + 8; break;
        }
      }
      if (end !== -1 && end - p > 500) {
        images.push({ base64: buffer.slice(p, end).toString('base64'), mimeType: 'image/png' });
        p = end;
        continue;
      }
    }
    p++;
  }

  return images;
}

// Zero-dependency PPTX text extractor (PPTX = ZIP of XML)
async function parsePptx(buffer) {
  const { inflateRaw } = await import('node:zlib');
  const { promisify } = await import('node:util');
  const inflate = promisify(inflateRaw);
  const slides = [];
  let pos = 0;
  while (pos <= buffer.length - 30) {
    // ZIP local file header: PK\x03\x04
    if (buffer[pos] !== 0x50 || buffer[pos+1] !== 0x4b || buffer[pos+2] !== 0x03 || buffer[pos+3] !== 0x04) { pos++; continue; }
    const method   = buffer.readUInt16LE(pos + 8);
    const compSize = buffer.readUInt32LE(pos + 18);
    const fnLen    = buffer.readUInt16LE(pos + 26);
    const extraLen = buffer.readUInt16LE(pos + 28);
    if (fnLen === 0 || fnLen > 512) { pos++; continue; }
    const filename  = buffer.slice(pos + 30, pos + 30 + fnLen).toString('utf8');
    const dataStart = pos + 30 + fnLen + extraLen;
    if (dataStart >= buffer.length) break;
    if (/^ppt\/slides\/slide\d+\.xml$/.test(filename) && compSize > 0 && compSize < 10_000_000) {
      const compressed = buffer.slice(dataStart, Math.min(dataStart + compSize, buffer.length));
      try {
        const xmlBuf = method === 8 ? await inflate(compressed) : compressed;
        const xml    = xmlBuf.toString('utf8');
        const texts  = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/g)]
          .map(m => m[1].trim()).filter(Boolean);
        const n = parseInt(filename.match(/slide(\d+)/)?.[1] || '0');
        if (texts.length) slides.push({ n, text: texts.join(' ').replace(/\s+/g, ' ') });
      } catch (_) {}
    }
    pos = dataStart + Math.max(1, compSize);
  }
  slides.sort((a, b) => a.n - b.n);
  return { text: slides.map(s => s.text).join('\n\n'), numpages: Math.max(1, slides.length) };
}

// Zero-dependency XLSX text extractor (XLSX = ZIP of XML)
async function parseXlsx(buffer) {
  const { inflateRaw } = await import('node:zlib');
  const { promisify } = await import('node:util');
  const inflate = promisify(inflateRaw);

  // Reusable ZIP entry extractor
  async function extractZipEntries(buf, test) {
    const results = {};
    let pos = 0;
    while (pos <= buf.length - 30) {
      if (buf[pos] !== 0x50 || buf[pos+1] !== 0x4b || buf[pos+2] !== 0x03 || buf[pos+3] !== 0x04) { pos++; continue; }
      const method   = buf.readUInt16LE(pos + 8);
      const compSize = buf.readUInt32LE(pos + 18);
      const fnLen    = buf.readUInt16LE(pos + 26);
      const extraLen = buf.readUInt16LE(pos + 28);
      if (fnLen === 0 || fnLen > 512) { pos++; continue; }
      const filename  = buf.slice(pos + 30, pos + 30 + fnLen).toString('utf8');
      const dataStart = pos + 30 + fnLen + extraLen;
      if (dataStart >= buf.length) break;
      if (test(filename) && compSize > 0 && compSize < 10_000_000) {
        const compressed = buf.slice(dataStart, Math.min(dataStart + compSize, buf.length));
        try {
          const xmlBuf = method === 8 ? await inflate(compressed) : compressed;
          results[filename] = xmlBuf.toString('utf8');
        } catch (_) {}
      }
      pos = dataStart + Math.max(1, compSize);
    }
    return results;
  }

  const files = await extractZipEntries(buffer, f =>
    f === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(f)
  );

  // Build shared strings lookup
  const sharedStrings = [];
  if (files['xl/sharedStrings.xml']) {
    for (const m of files['xl/sharedStrings.xml'].matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      const texts = [...m[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(t => t[1]);
      sharedStrings.push(texts.join(''));
    }
  }

  // Parse sheets in order
  const sheetEntries = Object.entries(files)
    .filter(([k]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort(([a], [b]) => parseInt(a.match(/sheet(\d+)/)?.[1] || 0) - parseInt(b.match(/sheet(\d+)/)?.[1] || 0));

  const rows = [];
  for (const [, xml] of sheetEntries) {
    for (const rowM of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const cM of rowM[1].matchAll(/<c\s[^>]*>([\s\S]*?)<\/c>/g)) {
        const t = (cM[0].match(/\st="([^"]+)"/) || [])[1] || '';
        let val = '';
        if (t === 's') {
          const v = (cM[1].match(/<v>(\d+)<\/v>/) || [])[1];
          if (v != null) val = sharedStrings[parseInt(v)] || '';
        } else if (t === 'inlineStr') {
          val = (cM[1].match(/<t>([^<]*)<\/t>/) || [])[1] || '';
        } else if (t !== 'e') {
          val = (cM[1].match(/<v>([^<]*)<\/v>/) || [])[1] || '';
        }
        if (val.trim()) cells.push(val.trim());
      }
      if (cells.length) rows.push(cells.join('\t'));
    }
  }

  return { text: rows.join('\n'), numpages: Math.max(1, sheetEntries.length) };
}

// Extract images from PPTX (PNG/JPEG only, no count limit — all images extracted)
async function extractPptxImages(buffer) {
  const { inflateRaw } = await import('node:zlib');
  const { promisify } = await import('node:util');
  const inflate = promisify(inflateRaw);
  const images = [];
  let pos = 0;
  while (pos <= buffer.length - 30) {
    if (buffer[pos] !== 0x50 || buffer[pos+1] !== 0x4b || buffer[pos+2] !== 0x03 || buffer[pos+3] !== 0x04) { pos++; continue; }
    const method   = buffer.readUInt16LE(pos + 8);
    const compSize = buffer.readUInt32LE(pos + 18);
    const fnLen    = buffer.readUInt16LE(pos + 26);
    const extraLen = buffer.readUInt16LE(pos + 28);
    if (fnLen === 0 || fnLen > 512) { pos++; continue; }
    const filename  = buffer.slice(pos + 30, pos + 30 + fnLen).toString('utf8');
    const dataStart = pos + 30 + fnLen + extraLen;
    if (dataStart >= buffer.length) break;
    const isImg = /^ppt\/media\/[^/]+\.(png|jpe?g)$/i.test(filename);
    if (isImg && compSize > 0 && compSize < 10_000_000) {
      const compressed = buffer.slice(dataStart, Math.min(dataStart + compSize, buffer.length));
      try {
        const imgBuf = method === 8 ? await inflate(compressed) : compressed;
        const mimeType = /\.png$/i.test(filename) ? 'image/png' : 'image/jpeg';
        images.push({ base64: imgBuf.toString('base64'), mimeType });
      } catch (_) {}
    }
    pos = dataStart + Math.max(1, compSize);
  }
  return images;
}

// Vision-based OCR using GPT-4o — no native binaries needed
async function ocrImages(images) {
  const openai = getOpenAI();
  const results = [];
  for (const img of images.slice(0, 10)) { // cap at 10 images to control cost
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ALL text content visible in this image exactly as it appears. Preserve headings, bullets, numbers, and paragraph structure. Return only the extracted text — no commentary, no markdown code blocks.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:${img.mimeType};base64,${img.base64}`, detail: 'high' }
            }
          ]
        }]
      });
      results.push({ ...img, ocrText: res.choices[0].message.content.trim() });
    } catch (e) {
      console.warn('Vision OCR failed for image:', e.message);
      results.push({ ...img, ocrText: '' });
    }
  }
  return results;
}

export const maxDuration = 10;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: CORS });

    const ext = file.name.split('.').pop().toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!['pdf', 'docx', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'md', 'csv'].includes(ext)) {
      return NextResponse.json({ error: `Unsupported file type: .${ext}. Supported: PDF, DOCX, PPTX, XLSX, TXT` }, { status: 415, headers: CORS });
    }

    let text = '';
    let numpages = 1;
    let images = [];

    if (ext === 'pdf') {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const result = await pdfParse(buffer);
      text = result.text;
      numpages = result.numpages;
      // Extract all embedded images from the PDF binary (JPEG + PNG)
      images = extractPdfImages(buffer);
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      const docxImages = [];
      await mammoth.convertToHtml({ buffer }, {
        convertImage: mammoth.images.imgElement(async (image) => {
          if (['image/png', 'image/jpeg'].includes(image.contentType)) {
            const b64 = await image.read('base64');
            docxImages.push({ base64: b64, mimeType: image.contentType });
          }
          return { src: '' };
        })
      });
      images = docxImages;
    } else if (ext === 'pptx' || ext === 'ppt') {
      const result = await parsePptx(buffer);
      text = result.text;
      numpages = result.numpages;
      images = await extractPptxImages(buffer);
      // Don't throw yet — OCR may recover text from slide images below
    } else if (ext === 'xlsx' || ext === 'xls') {
      const result = await parseXlsx(buffer);
      text = result.text;
      numpages = result.numpages;
      if (!text.trim()) throw new Error('No text found in spreadsheet. The file may be empty or contain only formulas.');
    } else {
      text = buffer.toString('utf-8');
    }

    // Determine if text extraction is sparse (complex designed PDF / scanned pages)
    const rawWordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const wordsPerPage = numpages > 0 ? rawWordCount / numpages : rawWordCount;
    const isSparse = wordsPerPage < 50; // < 50 words/page = likely designed/image-heavy PDF

    // Run GPT-4o Vision OCR on extracted images when: text is absent OR sparse
    if (images.length && (!text.trim() || isSparse)) {
      images = await ocrImages(images);
    }

    // Use vision text if it's richer than what pdf-parse got
    if (images.length) {
      const ocrBody = images.map(img => img.ocrText || '').filter(Boolean).join('\n\n');
      if (ocrBody.trim() && ocrBody.length > text.length) {
        text = ocrBody;
      } else if (!text.trim()) {
        if (ext === 'pptx' || ext === 'ppt') {
          throw new Error('No text found in presentation. The file may be image-only or password-protected.');
        } else if (ext === 'pdf') {
          throw new Error('No text found in PDF. The file may be a scanned image — OCR could not recover text.');
        }
      }
    }

    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const truncated = text.length > 100000;
    if (truncated) text = text.substring(0, 100000);

    // Stats
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const readingMins = Math.max(1, Math.round(words / 200));

    // AI domain detection — gpt-4o-mini, very cheap (~$0.00002 per call)
    let domain = 'General';
    try {
      const snap = text.substring(0, 1500);
      const res = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        max_tokens: 15,
        messages: [
          { role: 'system', content: 'Identify the subject domain of this content in 3-5 words. Reply with ONLY the domain, nothing else. Examples: "Corporate Communication", "Sales Training", "Cricket & Sports", "Financial Compliance".' },
          { role: 'user', content: snap }
        ]
      });
      domain = res.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    } catch (e) {
      console.warn('Domain detection skipped:', e.message);
    }

    return NextResponse.json({ text, truncated, numpages, words, readingMins, domain, images }, { headers: CORS });

  } catch (error) {
    console.error('extract-file error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }
}
