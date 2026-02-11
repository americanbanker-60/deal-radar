import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLocation, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Building2, MapPin, DollarSign, Users, Globe, 
  Calendar, Target, Award, TrendingUp, Mail, Phone, User,
  ExternalLink, Sparkles, Clock, FileText, AlertCircle, Tag
} from "lucide-react";

export default function TargetDetails() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const targetId = params.get('id');
  
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (targetId) {
      loadTarget();
    }
  }, [targetId]);

  const loadTarget = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.BDTarget.get(targetId);
      setTarget(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading target details...</p>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error || "Target not found"}
          </AlertDescription>
        </Alert>
        <Link to={createPageUrl("SavedTargets")}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Targets
          </Button>
        </Link>
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, label, value, badge }) => (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-5 h-5 text-slate-400 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="text-base text-slate-900 mt-1">
          {badge ? badge : (value || "—")}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("SavedTargets")}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{target.name}</h1>
          <p className="text-slate-600 mt-1">{target.companyShortName || target.correspondenceName}</p>
        </div>
        <Badge className={
          target.qualityTier === "great" ? "bg-green-100 text-green-800 border-green-200" :
          target.qualityTier === "good" ? "bg-blue-100 text-blue-800 border-blue-200" :
          "bg-slate-100 text-slate-800 border-slate-200"
        }>
          {target.qualityTier?.toUpperCase() || "UNSCORED"}
        </Badge>
      </div>

      {target.strategicRationale && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-5 h-5" />
              Strategic Rationale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{target.strategicRationale}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <InfoRow 
              icon={FileText} 
              label="Full Legal Name" 
              value={target.name} 
            />
            <InfoRow 
              icon={Tag} 
              label="Campaign" 
              value={target.campaign} 
            />
            <InfoRow 
              icon={Award} 
              label="Sector Focus" 
              badge={target.sectorFocus && <Badge variant="outline">{target.sectorFocus}</Badge>}
            />
            <InfoRow 
              icon={Building2} 
              label="Industry/Subsector" 
              value={target.subsector || target.industry} 
            />
            <InfoRow 
              icon={User} 
              label="Assigned To" 
              value={target.assignedTo} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Location & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <InfoRow 
              icon={MapPin} 
              label="City" 
              value={target.city} 
            />
            <InfoRow 
              icon={MapPin} 
              label="State" 
              value={target.state} 
            />
            <InfoRow 
              icon={Globe} 
              label="Website" 
              badge={target.website && (
                <a 
                  href={target.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {target.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            />
            <InfoRow 
              icon={Globe} 
              label="Website Status" 
              badge={
                target.websiteStatus === "working" ? (
                  <Badge className="bg-green-100 text-green-700">✓ Working</Badge>
                ) : target.websiteStatus === "broken" ? (
                  <Badge className="bg-red-100 text-red-700">✗ Broken</Badge>
                ) : null
              }
            />
            <InfoRow 
              icon={MapPin} 
              label="Clinic Count" 
              value={target.clinicCount?.toString()} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Financial & Size
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <InfoRow 
              icon={DollarSign} 
              label="Revenue" 
              value={target.revenue ? `$${target.revenue}M` : null} 
            />
            <InfoRow 
              icon={Users} 
              label="Employees" 
              value={target.employees?.toString()} 
            />
            <InfoRow 
              icon={Building2} 
              label="Ownership" 
              value={target.ownership} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Scoring & Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <InfoRow 
              icon={Target} 
              label="Fit Score" 
              badge={
                <div className="flex items-center gap-2">
                  <Badge className={
                    target.score >= 75 ? "bg-green-100 text-green-700" :
                    target.score >= 50 ? "bg-yellow-100 text-yellow-700" :
                    "bg-slate-100 text-slate-600"
                  }>
                    {target.score}%
                  </Badge>
                </div>
              }
            />
            <InfoRow 
              icon={Award} 
              label="Quality Score" 
              value={target.qualityScore ? `${target.qualityScore}/100` : null} 
            />
            <InfoRow 
              icon={FileText} 
              label="Quality Reason" 
              value={target.qualityReason} 
            />
            {target.qualityFlags && target.qualityFlags.length > 0 && (
              <InfoRow 
                icon={AlertCircle} 
                label="Quality Flags" 
                badge={
                  <div className="flex flex-wrap gap-1">
                    {target.qualityFlags.map((flag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <InfoRow 
              icon={User} 
              label="Contact Name" 
              value={`${target.contactFirstName || ""} ${target.contactLastName || ""}`.trim() || null} 
            />
            <InfoRow 
              icon={User} 
              label="Preferred Name" 
              value={target.contactPreferredName} 
            />
            <InfoRow 
              icon={Award} 
              label="Title/Credential" 
              value={`${target.contactTitle || ""} ${target.contactCredential || ""}`.trim() || null} 
            />
            <InfoRow 
              icon={Mail} 
              label="Email" 
              value={target.contactEmail} 
            />
            <InfoRow 
              icon={Phone} 
              label="Phone" 
              value={target.contactPhone} 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Activity & Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 divide-y">
            <InfoRow 
              icon={TrendingUp} 
              label="Growth Signals" 
              value={target.growthSignals} 
            />
            <InfoRow 
              icon={Calendar} 
              label="Signals Last Checked" 
              value={target.growthSignalsDate ? new Date(target.growthSignalsDate).toLocaleDateString() : null} 
            />
            <InfoRow 
              icon={Calendar} 
              label="Last Active" 
              value={target.lastActive ? new Date(target.lastActive).toLocaleDateString() : null} 
            />
            <InfoRow 
              icon={AlertCircle} 
              label="Dormancy Flag" 
              badge={target.dormancyFlag && (
                <Badge className="bg-amber-100 text-amber-700">Potentially Dormant (12+ months)</Badge>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {target.personalization_snippet && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-5 h-5" />
              Personalized Opener
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 italic">"{target.personalization_snippet}"</p>
          </CardContent>
        </Card>
      )}

      {target.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{target.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600" />
            Record History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Created:</span>
            <span className="font-medium">
              {new Date(target.created_date).toLocaleString()} by {target.created_by}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Last Updated:</span>
            <span className="font-medium">
              {new Date(target.updated_date).toLocaleString()}
            </span>
          </div>
          {target.contactEnrichmentDate && (
            <>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Contact Enriched:</span>
                <span className="font-medium">
                  {new Date(target.contactEnrichmentDate).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}