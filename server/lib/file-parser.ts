/**
 * File Parser — 첨부파일 텍스트 추출 + 이미지 감지
 * 지원: PDF, DOCX, XLSX, TXT/MD/CSV/JSON, HWPX, 이미지
 * Author: Mingu (Backend Developer) | 2026-04-17
 */

export interface ParsedFile {
  type: "text" | "image";
  filename: string;
  /** Extracted text content (for text type) */
  text?: string;
  /** Image URL or base64 data URI (for image type) */
  imageUrl?: string;
  /** MIME type of the original file */
  mimeType: string;
}

const IMAGE_MIMES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
]);

const TEXT_MIMES = new Set([
  "text/plain", "text/markdown", "text/csv", "text/html",
  "application/json", "application/xml", "text/xml",
]);

const MAX_TEXT_LENGTH = 30_000; // ~7500 tokens, safe for most models

function truncate(text: string, max = MAX_TEXT_LENGTH): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `\n\n[... 텍스트가 ${max}자에서 잘렸습니다. 전체 ${text.length}자]`;
}

/**
 * Parse an attachment into text or image reference
 */
export async function parseAttachment(attachment: {
  url: string;
  name: string;
  type: string;
  size?: number;
  path?: string;
}): Promise<ParsedFile> {
  const { url, name, type: mimeType } = attachment;

  // 1. Images → return as image reference (for vision/multimodal)
  if (IMAGE_MIMES.has(mimeType)) {
    return { type: "image", filename: name, imageUrl: url, mimeType };
  }

  // 2. Download file buffer
  let buffer: Buffer;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } catch (err: any) {
    return {
      type: "text",
      filename: name,
      text: `[파일 다운로드 실패: ${name} — ${err.message}]`,
      mimeType,
    };
  }

  // 3. Text-based files → direct read
  if (TEXT_MIMES.has(mimeType) || name.match(/\.(txt|md|csv|json|xml|html|log|yml|yaml|toml|env|sh|ts|js|py|sql)$/i)) {
    const text = buffer.toString("utf-8");
    return { type: "text", filename: name, text: truncate(text), mimeType };
  }

  // 4. PDF
  if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      const text = result.text?.trim();
      if (!text) return { type: "text", filename: name, text: `[PDF 파일이지만 텍스트를 추출할 수 없습니다: ${name}]`, mimeType };
      return { type: "text", filename: name, text: truncate(text), mimeType };
    } catch (err: any) {
      return { type: "text", filename: name, text: `[PDF 파싱 실패: ${name} — ${err.message}]`, mimeType };
    }
  }

  // 5. DOCX
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim();
      if (!text) return { type: "text", filename: name, text: `[DOCX 파일이지만 텍스트가 없습니다: ${name}]`, mimeType };
      return { type: "text", filename: name, text: truncate(text), mimeType };
    } catch (err: any) {
      return { type: "text", filename: name, text: `[DOCX 파싱 실패: ${name} — ${err.message}]`, mimeType };
    }
  }

  // 6. XLSX
  if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || name.endsWith(".xlsx")) {
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheets: string[] = [];
      for (const sheetName of workbook.SheetNames.slice(0, 5)) { // max 5 sheets
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
        sheets.push(`[시트: ${sheetName}]\n${csv}`);
      }
      const text = sheets.join("\n\n");
      return { type: "text", filename: name, text: truncate(text), mimeType };
    } catch (err: any) {
      return { type: "text", filename: name, text: `[XLSX 파싱 실패: ${name} — ${err.message}]`, mimeType };
    }
  }

  // 7. HWPX (ZIP + XML)
  if (name.endsWith(".hwpx")) {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(buffer);
      const sections: string[] = [];
      // HWPX stores content in Contents/section*.xml
      for (const [path, file] of Object.entries(zip.files)) {
        if (path.match(/Contents\/section\d+\.xml/i) && !file.dir) {
          const xml = await file.async("string");
          // Extract text from XML (strip tags)
          const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (text) sections.push(text);
        }
      }
      if (sections.length === 0) {
        return { type: "text", filename: name, text: `[HWPX 파일에서 텍스트를 찾을 수 없습니다: ${name}]`, mimeType };
      }
      return { type: "text", filename: name, text: truncate(sections.join("\n\n")), mimeType };
    } catch (err: any) {
      return { type: "text", filename: name, text: `[HWPX 파싱 실패: ${name} — ${err.message}]`, mimeType };
    }
  }

  // 8. HWP (binary) → not supported
  if (name.endsWith(".hwp")) {
    return {
      type: "text",
      filename: name,
      text: `[HWP 바이너리 파일은 지원되지 않습니다. HWPX 형식으로 변환 후 업로드해주세요: ${name}]`,
      mimeType,
    };
  }

  // 9. Unknown format
  return {
    type: "text",
    filename: name,
    text: `[지원되지 않는 파일 형식입니다: ${name} (${mimeType})]`,
    mimeType,
  };
}

/**
 * Parse multiple attachments and build LLM context
 */
export async function parseAttachments(attachments: any[]): Promise<ParsedFile[]> {
  if (!attachments || attachments.length === 0) return [];
  const results = await Promise.all(attachments.map(parseAttachment));
  return results;
}

/**
 * Build text context from parsed files (for non-vision models)
 */
export function buildFileContext(parsed: ParsedFile[]): string {
  const textFiles = parsed.filter(f => f.type === "text" && f.text);
  if (textFiles.length === 0) return "";

  const sections = textFiles.map(f =>
    `[첨부파일: ${f.filename}]\n${f.text}`
  );
  return "\n\n" + sections.join("\n\n");
}
