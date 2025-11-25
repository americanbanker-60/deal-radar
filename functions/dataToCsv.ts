import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data } = await req.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            return Response.json({ error: 'No data provided' }, { status: 400 });
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);
        
        // Escape CSV values
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // Build CSV
        const csvLines = [
            headers.map(escapeCSV).join(','),
            ...data.map(row => headers.map(h => escapeCSV(row[h])).join(','))
        ];

        const csv = csvLines.join('\n');

        return Response.json({ csv });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});