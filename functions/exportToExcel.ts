/**
 * Export data to Excel file
 * Returns: { fileUrl: string } - URL to download the file
 */
export default async function exportToExcel({ data, filename }, { integrations }) {
  const XLSX = await import('xlsx');
  
  // Create worksheet from data
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  // Upload to storage
  const file = new File([buffer], filename || 'export.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  
  const { file_url } = await integrations.Core.UploadFile({ file });
  
  return { fileUrl: file_url };
}