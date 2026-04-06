import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Generate the logo
    const result = await base44.integrations.Core.GenerateImage({
      prompt: "A minimalist vector logo icon featuring a clean geometric radar or target design. The icon should consist of concentric circles with a subtle directional element like a scanning beam or arrow, suggesting precision and discovery. Use a modern flat design style with emerald green and blue gradients. The composition should be perfectly centered, balanced, and work well at small sizes. Abstract geometric shapes only - absolutely no text, letters, words, or typography of any kind. Professional business logo aesthetic with clean lines and smooth curves. Simple, memorable, and scalable vector art."
    });
    
    return Response.json({ 
      success: true,
      logoUrl: result.url 
    });
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});