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

/**
 * IMPORTANT: This scoring logic is shared with components/utils/scoring.js
 * If you modify this function, update the frontend utility to keep scores consistent.
 */
function calculateScore(target, { weights, targetRange, fitKeywords }) {
    const defaultWeights = {
        employees: 35,
        clinics: 25,
        revenue: 15,
        website: 15,
        keywords: 10
    };

    const w = { ...defaultWeights, ...weights };
    const keywordsLower = (fitKeywords || "").toLowerCase();

    // Employee score
    let empScore = 0;
    const emp = target.employees || 0;
    if (emp > 0 && targetRange?.minEmployees && targetRange?.maxEmployees) {
        const mid = (targetRange.minEmployees + targetRange.maxEmployees) / 2;
        const distance = Math.abs(emp - mid);
        const range = targetRange.maxEmployees - targetRange.minEmployees;
        empScore = range > 0 ? Math.max(0, 100 - (distance / range) * 100) : (emp === mid ? 100 : 0);
    }

    // Clinic score
    let clinicScore = 0;
    const clinics = target.clinicCount || 0;
    if (clinics > 0) {
        clinicScore = Math.min(100, clinics * 25);
    }

    // Revenue score
    let revScore = 0;
    const rev = target.revenue || 0;
    if (rev > 0 && targetRange?.minRevenue && targetRange?.maxRevenue) {
        const mid = (targetRange.minRevenue + targetRange.maxRevenue) / 2;
        const distance = Math.abs(rev - mid);
        const range = targetRange.maxRevenue - targetRange.minRevenue;
        revScore = range > 0 ? Math.max(0, 100 - (distance / range) * 100) : (rev === mid ? 100 : 0);
    }

    // Website score
    let websiteScore = 0;
    if (target.websiteStatus === "working") websiteScore = 100;
    else if (target.websiteStatus === "broken") websiteScore = 50;

    // Keyword score
    let keywordScore = 0;
    if (keywordsLower) {
        const textToCheck = [
            target.name || "",
            target.industry || "",
            target.subsector || "",
            target.sectorFocus || "",
            target.notes || ""
        ].join(" ").toLowerCase();
        
        if (textToCheck.includes(keywordsLower)) {
            keywordScore = 100;
        }
    }

    // Calculate weighted total
    const totalWeight = w.employees + w.clinics + w.revenue + w.website + w.keywords;
    let score = totalWeight > 0 
        ? Math.round(
            (empScore * w.employees + 
             clinicScore * w.clinics + 
             revScore * w.revenue + 
             websiteScore * w.website + 
             keywordScore * w.keywords) / totalWeight
          )
        : 0;

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