import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

        // Decode base64 content
        const decoded = atob(fileContent);
        
        // Parse CSV
        const lines = decoded.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            return Response.json({ error: 'Empty CSV file' }, { status: 400 });
        }

        // Extract headers from first line
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Parse rows
        const rows = [];
        const skipped = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = parseCSVLine(line);
            
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
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
                totalLines: lines.length,
                rowsParsed: rows.length,
                emptyRowsSkipped: skipped.length
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Simple CSV line parser that handles quoted values
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim().replace(/^"|"$/g, ''));
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    
    // Push the last value
    values.push(currentValue.trim().replace(/^"|"$/g, ''));
    
    return values;
}