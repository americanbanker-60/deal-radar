import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Users,
  Link as LinkIcon,
  AlertCircle,
  Shield
} from "lucide-react";

export default function OutreachIntegration({ prospects, onSyncComplete }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);
  const [customTag, setCustomTag] = useState("BD-Priority");
  const [customSource, setCustomSource] = useState("Ops Console");
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const pollIntervalRef = React.useRef(null);

  useEffect(() => {
    checkConnection();
  }, []);

  // Poll OutreachConnection entity while loading
  useEffect(() => {
    if (!loading) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const user = await base44.auth.me();
        const connections = await base44.entities.OutreachConnection.list();
        const userConnection = connections.find(c => c.user_email === user.email && c.status === "connected");

        if (userConnection) {
          setConnected(true);
          setLoading(false);
          setError(null);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loading]);

  const checkConnection = async () => {
    try {
      const user = await base44.auth.me();
      const connections = await base44.entities.OutreachConnection.list();
      const userConnection = connections.find(c => c.user_email === user.email && c.status === "connected");
      setConnected(!!userConnection);
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const connectOutreach = async () => {
    setLoading(true);
    setError(null);
    setNeedsReconnect(false);
    
    try {
      const result = await base44.functions.invoke('outreachInitAuth', {});
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      // Validate auth URL before opening popup
      const authUrl = result.data.authUrl;
      if (!authUrl || !authUrl.startsWith('https://')) {
        throw new Error("Invalid authorization URL received.");
      }

      const popup = window.open(
        authUrl,
        "Outreach Authorization",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error("Popup was blocked. Please allow popups for this site.");
      }

      // Monitor popup closure
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          
          // Give database a moment to update
          setTimeout(() => {
            if (loading) {
              setLoading(false);
              setError("Authorization window closed. Please try again and approve the authorization.");
            }
          }, 3000);
        }
      }, 500);

    } catch (error) {
      setError("Failed to connect: " + error.message);
      setLoading(false);
    }
  };

  const syncToOutreach = async () => {
    if (!prospects || prospects.length === 0) {
      setError("No prospects to sync");
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    setError(null);

    try {
      const outreachProspects = prospects.map(p => ({
        email: p.contact?.email || "",
        firstName: p.contact?.firstName || "",
        lastName: p.contact?.lastName || "",
        title: p.contact?.title || "",
        company: p.name || "",
      })).filter(p => p.email);

      if (outreachProspects.length === 0) {
        setError("No prospects with email addresses found");
        setSyncing(false);
        return;
      }

      const customFields = {
        customTag: customTag,
        customSource: customSource,
      };

      const result = await base44.functions.invoke('outreachSyncProspects', {
        prospects: outreachProspects,
        sequenceId: null,
        customFields,
      });

      setSyncResult(result.data);
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error("❌ Sync error:", error);
      
      // Check for authorization errors
      const errorMsg = error.message || String(error);
      const isAuthError = 
        error.response?.status === 401 ||
        errorMsg.includes('401') ||
        errorMsg.includes('Unauthorized') ||
        errorMsg.includes('token') ||
        errorMsg.includes('Token expired') ||
        errorMsg.includes('refresh');
      
      if (isAuthError) {
        setError("Your Outreach connection has expired. Please reconnect your account.");
        setNeedsReconnect(true);
      } else {
        setError("Sync failed: " + errorMsg);
      }
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
      }
    } catch (error) {
      setError("Failed to disconnect: " + error.message);
    }
  };

  if (!connected) {
    return (
      <Card className="shadow-sm border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
            Connect Outreach.io
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">Direct Prospect Sync</h4>
              <p className="text-sm text-slate-600 mb-3">
                Connect your Outreach.io account to automatically create and update prospect records—no CSV exports needed.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Create & update prospects directly</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Include custom tags and scores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Safe mode: Does NOT add to sequences or send emails</span>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Required Settings in Outreach:</strong>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li><strong>Application Type:</strong> Web Application</li>
                <li><strong>Redirect URI:</strong> <code className="text-xs bg-white px-1 rounded">https://deal-radar.base44.app/OAuthCallback</code></li>
                <li><strong>Scopes:</strong> prospects.all, sequences.read</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={connectOutreach}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Waiting for authorization...</span>
                <span className="sm:hidden">Authorizing...</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Connect Outreach Account</span>
                <span className="sm:hidden">Connect Account</span>
              </>
            )}
          </Button>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border">
            <strong>What happens next:</strong>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>Popup opens with Outreach login</li>
              <li>Log in and click "Authorize"</li>
              <li>Popup will automatically redirect back and close</li>
              <li>Connection status will update here</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-green-200">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            Outreach.io Connected
          </CardTitle>
          <div className="flex gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={loading}
              className="text-xs sm:text-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectOutreach}
              className="text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Disconnect</span>
              <span className="sm:hidden">Disconnect</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 md:pt-6 space-y-4">
        
        <Alert className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Safe Mode Active:</strong> This will only create/update prospect records in Outreach. 
            Prospects will <strong>NOT</strong> be added to sequences or receive any emails automatically. 
            You'll manually add them to sequences in Outreach when ready.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <div className="flex flex-col gap-3">
                <div>{error}</div>
                {needsReconnect && (
                  <Button
                    onClick={connectOutreach}
                    disabled={loading}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reconnect Outreach Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

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

        <Button
          onClick={syncToOutreach}
          disabled={syncing || !prospects || prospects.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="hidden sm:inline">Syncing to Outreach...</span>
              <span className="sm:hidden">Syncing...</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Create/Update Prospects in Outreach</span>
              <span className="sm:hidden">Sync Prospects</span>
            </>
          )}
        </Button>

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
                    <span className="text-slate-700">Prospects Created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">~{syncResult.updated}</Badge>
                    <span className="text-slate-700">Prospects Updated</span>
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
                <div className="mt-3 p-2 bg-white rounded border border-green-300">
                  <p className="text-xs text-green-800">
                    ✓ No prospects were added to sequences. Add them manually in Outreach when ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-start gap-2">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>
            This integration only creates/updates prospect records with your custom fields. 
            No emails will be sent. You control when to add prospects to sequences in Outreach.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}