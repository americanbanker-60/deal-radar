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

        // Decode base64 to binary
        const binaryString = atob(fileContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create a blob and file
        const blob = new Blob([bytes], { type: 'text/csv' });
        const file = new File([blob], 'upload.csv', { type: 'text/csv' });

        // Upload file to get URL
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        const fileUrl = uploadResult.file_url;

        // Define JSON schema for extraction
        const jsonSchema = {
            type: "object",
            properties: {
                "Name": { type: "string" },
                "Domain": { type: "string" },
                "Description": { type: "string" },
                "LinkedIn": { type: "string" },
                "Revenue Estimate": { type: "string" },
                "Employee Estimate": { type: "string" },
                "Employees on Professional Networks": { type: "string" },
                "Total Review Count": { type: "string" },
                "Aggregate Rating": { type: "string" },
                "City": { type: "string" },
                "State": { type: "string" },
                "Country": { type: "string" },
                "Zip Code": { type: "string" },
                "Year Founded": { type: "string" },
                "Primary Email": { type: "string" },
                "Primary Phone": { type: "string" },
                "Notes": { type: "string" },
                "Executive First Name": { type: "string" },
                "Executive Last Name": { type: "string" },
                "Executive Title": { type: "string" },
                "Executive Email": { type: "string" },
                "Short Name": { type: "string" },
                "Sector": { type: "string" },
                "Clinic Location Count": { type: "string" }
            }
        };

        // Extract data using AI
        const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
            file_url: fileUrl,
            json_schema: jsonSchema
        });

        if (extractResult.status === "error") {
            return Response.json({ error: extractResult.details }, { status: 500 });
        }

        const rows = Array.isArray(extractResult.output) ? extractResult.output : [extractResult.output];
        const headers = Object.keys(rows[0] || {});

        return Response.json({ 
            headers, 
            rows,
            diagnostics: {
                totalRows: rows.length,
                extractionMethod: "AI-powered fuzzy mapping"
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});