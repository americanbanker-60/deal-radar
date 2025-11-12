import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Users,
  Link as LinkIcon,
  AlertCircle
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function OutreachIntegration({ prospects, onSyncComplete }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sequences, setSequences] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  
  // Custom fields for Outreach
  const [customTag, setCustomTag] = useState("BD-Priority");
  const [customSource, setCustomSource] = useState("Ops Console");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const user = await base44.auth.me();
      const connections = await base44.entities.OutreachConnection.list();
      const userConnection = connections.find(c => c.user_email === user.email && c.status === "connected");
      setConnected(!!userConnection);
      
      if (userConnection) {
        loadSequences();
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const loadSequences = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('outreachGetSequences', {});
      setSequences(result.data.sequences);
    } catch (error) {
      console.error("Error loading sequences:", error);
    }
    setLoading(false);
  };

  const connectOutreach = async () => {
    setLoading(true);
    try {
      // Get the full redirect URI including app path
      const redirectUri = `${window.location.origin}${createPageUrl('OAuthCallback')}`;
      const result = await base44.functions.invoke('outreachInitAuth', { redirectUri });
      
      // Open OAuth flow in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        result.data.authUrl,
        "Outreach Authorization",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = async (event) => {
        if (event.data.type === "outreach-oauth-success" && event.data.code) {
          try {
            const result = await base44.functions.invoke('outreachCompleteAuth', {
              code: event.data.code,
              redirectUri,
            });
            
            if (result.data.success) {
              setConnected(true);
              loadSequences();
              if (popup && !popup.closed) {
                popup.close();
              }
            } else {
              alert("Failed to complete authorization: " + (result.data.error || "Unknown error"));
            }
          } catch (error) {
            alert("Failed to complete authorization: " + error.message);
          }
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (error) {
      alert("Failed to connect: " + error.message);
    }
    setLoading(false);
  };

  const syncToOutreach = async () => {
    if (!prospects || prospects.length === 0) {
      alert("No prospects to sync");
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      // Transform prospects to Outreach format
      const outreachProspects = prospects.map(p => ({
        email: p.contact?.email || "",
        firstName: p.contact?.firstName || "",
        lastName: p.contact?.lastName || "",
        title: p.contact?.title || "",
        company: p.name || "",
      })).filter(p => p.email); // Only include prospects with email

      if (outreachProspects.length === 0) {
        alert("No prospects with email addresses found");
        setSyncing(false);
        return;
      }

      const customFields = {
        customTag: customTag,
        customSource: customSource,
      };

      const result = await base44.functions.invoke('outreachSyncProspects', {
        prospects: outreachProspects,
        sequenceId: selectedSequence || null,
        customFields,
      });

      setSyncResult(result.data);
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      alert("Sync failed: " + error.message);
    }
    
    setSyncing(false);
  };

  const disconnectOutreach = async () => {
    try {
      const user = await base44.auth.me();
      const connections = await base44.entities.OutreachConnection.list();
      const userConnection = connections.find(c => c.user_email === user.email);
      
      if (userConnection) {
        await base44.entities.OutreachConnection.update(userConnection.id, {
          status: "disconnected"
        });
        setConnected(false);
        setSequences([]);
        setSelectedSequence("");
      }
    } catch (error) {
      alert("Failed to disconnect: " + error.message);
    }
  };

  if (!connected) {
    return (
      <Card className="shadow-sm border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            Connect Outreach.io
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">Direct Prospect Sync</h4>
              <p className="text-sm text-slate-600 mb-3">
                Connect your Outreach.io account to automatically create prospects and add them to sequences—no CSV exports needed.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Create & update prospects directly</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Add to sequences automatically</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Include custom tags and scores</span>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Setup Required:</strong> In Outreach Settings → API → OAuth Applications, set your redirect URI to:<br/>
              <code className="text-xs bg-white px-2 py-0.5 rounded mt-1 inline-block">
                {window.location.origin}{createPageUrl('OAuthCallback')}
              </code>
            </AlertDescription>
          </Alert>

          <Button
            onClick={connectOutreach}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect Outreach Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-green-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Outreach.io Connected
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSequences}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectOutreach}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Sequence Selector */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Select Sequence (Optional)</div>
          <Select value={selectedSequence} onValueChange={setSelectedSequence}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a sequence or leave blank..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>No Sequence (Just create prospects)</SelectItem>
              {sequences.map(seq => (
                <SelectItem key={seq.id} value={seq.id}>
                  {seq.name}
                  {seq.tags && seq.tags.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({seq.tags.join(", ")})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading sequences...
            </div>
          )}
        </div>

        {/* Custom Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom Tag</div>
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="e.g., BD-Priority"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom Source</div>
            <Input
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              placeholder="e.g., Ops Console"
            />
          </div>
        </div>

        {/* Prospect Count */}
        <div className="bg-slate-50 p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">
                Ready to sync {prospects?.filter(p => p.contact?.email).length || 0} prospects
              </span>
            </div>
            {prospects?.filter(p => !p.contact?.email).length > 0 && (
              <Badge variant="outline" className="text-xs">
                {prospects.filter(p => !p.contact?.email).length} without email
              </Badge>
            )}
          </div>
        </div>

        {/* Sync Button */}
        <Button
          onClick={syncToOutreach}
          disabled={syncing || !prospects || prospects.length === 0}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Syncing to Outreach...
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              Sync to Outreach.io
            </>
          )}
        </Button>

        {/* Sync Results */}
        {syncResult && (
          <div className={`p-4 rounded-lg border ${
            syncResult.success 
              ? "bg-green-50 border-green-200" 
              : "bg-amber-50 border-amber-200"
          }`}>
            <div className="flex items-start gap-3">
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-semibold mb-2 ${
                  syncResult.success ? "text-green-900" : "text-amber-900"
                }`}>
                  Sync {syncResult.success ? "Complete" : "Completed with Errors"}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">+{syncResult.created}</Badge>
                    <span className="text-slate-700">Created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">~{syncResult.updated}</Badge>
                    <span className="text-slate-700">Updated</span>
                  </div>
                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-red-600">{syncResult.errors.length}</Badge>
                        <span className="text-slate-700">Errors</span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1 max-h-32 overflow-y-auto">
                        {syncResult.errors.slice(0, 5).map((err, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <XCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                            <span>{err.email}: {err.error}</span>
                          </div>
                        ))}
                        {syncResult.errors.length > 5 && (
                          <div className="text-muted-foreground">
                            ...and {syncResult.errors.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-start gap-2">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>
            Prospects will be created/updated in Outreach with your custom fields. 
            If a sequence is selected, they'll be automatically added to it.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}