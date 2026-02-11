import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetIds } = await req.json();
    
    if (!Array.isArray(targetIds) || targetIds.length === 0) {
      return Response.json({ error: 'No target IDs provided' }, { status: 400 });
    }

    // Delete one at a time with delays to avoid rate limits
    let deletedCount = 0;

    for (const id of targetIds) {
      await base44.asServiceRole.entities.BDTarget.delete(id);
      deletedCount++;
      
      // Add 100ms delay between each deletion to avoid rate limits
      if (deletedCount < targetIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return Response.json({ 
      success: true, 
      deleted: deletedCount 
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return Response.json({ 
      error: error.message || 'Delete failed' 
    }, { status: 500 });
  }
});