/**
 * Parse CSV file from base64 or buffer
 * Returns: { headers: string[], rows: object[] }
 */
export default async function parseCsvFile({ fileContent }) {
  // fileContent should be base64 string or text content
  const text = Buffer.from(fileContent, 'base64').toString('utf8');
  
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  // Parse CSV manually (handles quotes and commas)
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result.map(field => field.trim());
  };
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return { headers, rows };
}