const pdfParse = require('pdf-parse');

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('Failed to parse PDF', error);
    throw new Error('PDF_PARSING_FAILED');
  }
}

export function isSupportedMimeType(mime: string): boolean {
  const supported = ['application/pdf'];
  return supported.includes(mime);
}
