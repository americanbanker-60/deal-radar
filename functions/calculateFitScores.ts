import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { weights, targetRange, fitKeywords } = await req.json();

        // Fetch all BDTarget records for this user
        const targets = await base44.entities.BDTarget.list('-created_date');
        
        if (targets.length === 0) {
            return Response.json({ message: 'No targets to score', updated: 0 });
        }

        // Calculate scores for each target
        const updates = [];
        for (const target of targets) {
            const score = calculateScore(target, { weights, targetRange, fitKeywords });
            updates.push(base44.entities.BDTarget.update(target.id, { score }));
        }

        await Promise.all(updates);

        return Response.json({ 
            message: 'Scores updated successfully', 
            updated: targets.length 
        });
    } catch (error) {
        console.error('calculateFitScores error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateScore(target, { weights, targetRange, fitKeywords }) {
    const w = weights || { employees: 35, clinics: 25, revenue: 15, website: 15, keywords: 10 };
    
    // Employee score
    let empScore = 0;
    if (targetRange?.minEmployees && targetRange?.maxEmployees) {
        const emp = target.employees || 0;
        const min = targetRange.minEmployees;
        const max = targetRange.maxEmployees;
        const mid = (min + max) / 2;
        const range = max - min;
        empScore = Math.max(0, 100 - (Math.abs(emp - mid) / range) * 100);
    }

    // Clinic score
    const clinicScore = target.clinicCount ? Math.min(100, (target.clinicCount / 10) * 100) : 0;

    // Revenue score
    let revScore = 0;
    if (targetRange?.minRevenue && targetRange?.maxRevenue) {
        const rev = target.revenue || 0;
        const min = targetRange.minRevenue;
        const max = targetRange.maxRevenue;
        const mid = (min + max) / 2;
        const range = max - min;
        revScore = Math.max(0, 100 - (Math.abs(rev - mid) / range) * 100);
    }

    // Website score
    const webScore = target.websiteStatus === 'working' ? 100 : 0;

    // Keyword score
    const keyScore = fitKeywords && target.sectorFocus?.toLowerCase().includes(fitKeywords.toLowerCase()) ? 100 : 0;

    // Weighted total
    let total = (
        (empScore * w.employees) +
        (clinicScore * w.clinics) +
        (revScore * w.revenue) +
        (webScore * w.website) +
        (keyScore * w.keywords)
    ) / 100;

    let score = Math.round(total);

    // Apply recency penalty based on lastActive date
    if (target.lastActive) {
        try {
            const lastActiveDate = new Date(target.lastActive);
            const now = new Date();
            const monthsInactive = (now - lastActiveDate) / (1000 * 60 * 60 * 24 * 30);
            
            if (monthsInactive > 12) {
                score = Math.max(0, score - 25);
            } else if (monthsInactive > 6) {
                score = Math.max(0, score - 10);
            }
        } catch (error) {
            // Invalid date, no penalty
        }
    }

    return score;
}