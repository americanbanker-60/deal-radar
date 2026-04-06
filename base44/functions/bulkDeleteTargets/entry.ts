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

    // Process in chunks to avoid overwhelming the database
    const CHUNK_SIZE = 50;
    let totalDeleted = 0;
    const failedIds = [];

    for (let i = 0; i < targetIds.length; i += CHUNK_SIZE) {
      const chunk = targetIds.slice(i, i + CHUNK_SIZE);

      for (const id of chunk) {
        try {
          await base44.asServiceRole.entities.BDTarget.delete(id);
          totalDeleted++;
        } catch (err) {
          console.error(`Failed to delete ${id}:`, err.message);
          failedIds.push({ id, error: err.message });
        }
      }

      // Small delay between chunks
      if (i + CHUNK_SIZE < targetIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return Response.json({
      success: failedIds.length === 0,
      deleted: totalDeleted,
      total: targetIds.length,
      failed: failedIds.length > 0 ? failedIds : undefined
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return Response.json({ 
      error: error.message || 'Delete failed' 
    }, { status: 500 });
  }
});