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

    // Delete in batches using service role to avoid rate limits
    const BATCH_SIZE = 100;
    let deletedCount = 0;

    for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
      const batch = targetIds.slice(i, i + BATCH_SIZE);
      
      for (const id of batch) {
        await base44.asServiceRole.entities.BDTarget.delete(id);
        deletedCount++;
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