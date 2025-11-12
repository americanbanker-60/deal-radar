/**
 * Parse Excel file (.xlsx) from base64
 * Returns: { headers: string[], rows: object[] }
 */
export default async function parseExcelFile({ fileContent }) {
  const XLSX = await import('xlsx');
  
  // Decode base64 to buffer
  const buffer = Buffer.from(fileContent, 'base64');
  
  // Read workbook
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  // Extract headers
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  
  return { headers, rows };
}