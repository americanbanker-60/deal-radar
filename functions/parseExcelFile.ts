import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { fileUrl } = await req.json();
        
        if (!fileUrl) {
            return Response.json({ error: 'No file URL provided' }, { status: 400 });
        }

        // Define JSON schema for extraction (supports both old and new export formats)
        const jsonSchema = {
            type: "object",
            properties: {
                "Name": { type: "string" },
                "Company Name": { type: "string" },
                "Domain": { type: "string" },
                "Correspondence_Name": { type: "string" },
                "Sector_Focus": { type: "string" },
                "Personalized_Hook": { type: "string" },
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

        // Extract data using AI with timeout protection
        const extractResult = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
            file_url: fileUrl,
            json_schema: jsonSchema
        });

        if (extractResult.status === "error") {
            console.error("ExtractDataFromUploadedFile error:", extractResult.details);
            return Response.json({ 
                error: `Failed to parse file: ${extractResult.details || 'Unknown error'}. Try a smaller file or use CSV format.` 
            }, { status: 500 });
        }

        if (!extractResult.output) {
            return Response.json({ 
                error: 'No data extracted from file. Please check the file format.' 
            }, { status: 400 });
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
        console.error("Excel parse error:", error);
        return Response.json({ 
            error: `File processing failed: ${error.message}. Large files may timeout - try CSV format or smaller batches.` 
        }, { status: 500 });
    }
});