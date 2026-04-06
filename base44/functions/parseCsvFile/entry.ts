import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { fileUrl } = await req.json();
        
        if (!fileUrl) {
            return Response.json({ error: 'No file URL provided' }, { status: 400 });
        }

        // Fetch the CSV file
        const response = await fetch(fileUrl);
        if (!response.ok) {
            return Response.json({ error: 'Failed to fetch file' }, { status: 400 });
        }

        const csvText = await response.text();
        
        // Parse CSV manually
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            return Response.json({ error: 'Empty CSV file' }, { status: 400 });
        }

        // Parse headers
        const headers = parseCSVLine(lines[0]);
        
        // Parse rows
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return Response.json({ 
            headers, 
            rows,
            diagnostics: {
                totalRows: rows.length,
                extractionMethod: "Direct CSV parsing"
            }
        });
    } catch (error) {
        console.error('Parse error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}