import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, filename } = await req.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            return Response.json({ error: 'No data provided' }, { status: 400 });
        }

        // Create workbook and worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Upload to storage
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const file = new File([blob], filename || 'export.xlsx', { type: blob.type });
        
        const uploadResult = await base44.integrations.Core.UploadFile({ file });

        return Response.json({ fileUrl: uploadResult.file_url });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});