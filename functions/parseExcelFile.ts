import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { fileContent } = await req.json();
        
        if (!fileContent) {
            return Response.json({ error: 'No file content provided' }, { status: 400 });
        }

        // Decode base64 content to binary
        const binaryString = atob(fileContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Parse Excel file
        const workbook = XLSX.read(bytes, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
            return Response.json({ error: 'Empty Excel file' }, { status: 400 });
        }

        // Extract headers from first row
        const headers = jsonData[0].map(h => String(h || '').trim());
        
        // Convert remaining rows to objects
        const rows = [];
        const skipped = [];
        for (let i = 1; i < jsonData.length; i++) {
            const rowArray = jsonData[i];
            const row = {};
            headers.forEach((header, index) => {
                row[header] = rowArray && rowArray[index] !== undefined ? String(rowArray[index]) : '';
            });
            
            // Check if row is completely empty
            const hasData = Object.values(row).some(v => v && v.trim());
            if (hasData) {
                rows.push(row);
            } else {
                skipped.push(i + 1);
            }
        }

        return Response.json({ 
            headers, 
            rows,
            diagnostics: {
                totalRows: jsonData.length,
                rowsParsed: rows.length,
                emptyRowsSkipped: skipped.length
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});