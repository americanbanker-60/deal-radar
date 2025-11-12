/**
 * Convert JSON data to CSV string
 * Returns: { csv: string }
 */
export default async function dataToCsv({ data }) {
  if (!data || data.length === 0) {
    return { csv: '' };
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Escape CSV value
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Build CSV
  const csvLines = [];
  csvLines.push(headers.map(escapeCSV).join(','));
  
  data.forEach(row => {
    const values = headers.map(header => escapeCSV(row[header]));
    csvLines.push(values.join(','));
  });
  
  return { csv: csvLines.join('\n') };
}