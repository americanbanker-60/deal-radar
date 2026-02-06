import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { fileUrl } = await req.json();
        
        if (!fileUrl) {
            return Response.json({ error: 'No file URL provided' }, { status: 400 });
        }

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