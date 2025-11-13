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
  const [redirectUri, setRedirectUri] = useState("");
  const [debugLogs, setDebugLogs] = useState([]);
  
  // Custom fields for Outreach
  const [customTag, setCustomTag] = useState("BD-Priority");
  const [customSource, setCustomSource] = useState("Ops Console");

  const addLog = (msg) => {
    console.log(msg);
    setDebugLogs(prev => [...prev, msg].slice(-10)); // Keep last 10 logs
  };

  useEffect(() => {
    checkConnection();
  }, []);

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
    setDebugLogs([]);
    
    try {
      addLog("🔗 Step 1: Requesting OAuth URL from backend...");
      
      const result = await base44.functions.invoke('outreachInitAuth', {});
      addLog("✅ Step 2: Auth URL received from backend");
      addLog("📍 Redirect URI: " + result.data.redirectUri);
      
      // Store redirect URI for display
      setRedirectUri(result.data.redirectUri);
      
      // Open OAuth flow in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      addLog("🪟 Step 3: Opening OAuth popup window...");
      
      const popup = window.open(
        result.data.authUrl,
        "Outreach Authorization",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error("Popup was blocked. Please allow popups for this site.");
      }

      addLog("✅ Step 4: Popup opened successfully");
      addLog("👂 Step 5: Listening for messages from popup...");

      // Listen for OAuth callback
      const handleMessage = async (event) => {
        addLog("📨 Message received! Type: " + event.data.type + ", Origin: " + event.origin);
        
        if (event.data.type === "outreach-oauth-error") {
          addLog("❌ OAuth error received: " + event.data.error);
          setError("OAuth error: " + event.data.error);
          setLoading(false);
          window.removeEventListener("message", handleMessage);
          if (popup && !popup.closed) {
            popup.close();
          }
          return;
        }

        if (event.data.type === "outreach-oauth-success" && event.data.code) {
          addLog("✅ Step 6: OAuth code received from popup!");
          addLog("🔄 Step 7: Sending code to backend to complete auth...");
          
          try {
            const completeResult = await base44.functions.invoke('outreachCompleteAuth', {
              code: event.data.code,
            });
            
            addLog("✅ Step 8: Backend response received");
            addLog("📊 Result: " + JSON.stringify(completeResult.data));
            
            if (completeResult.data.success) {
              addLog("🎉 Step 9: Successfully connected to Outreach!");
              setConnected(true);
              setError(null);
              setLoading(false);
              
              // Close popup
              if (popup && !popup.closed) {
                addLog("🚪 Closing popup window");
                popup.close();
              }
            } else {
              addLog("❌ Auth completion failed: " + (completeResult.data.error || "Unknown error"));
              setError("Failed to complete authorization: " + (completeResult.data.error || "Unknown error"));
              setLoading(false);
            }
          } catch (error) {
            addLog("❌ Error completing auth: " + error.message);
            setError("Failed to complete authorization: " + error.message);
            setLoading(false);
          }
          
          window.removeEventListener("message", handleMessage);
        }
      };

      // Start listening BEFORE opening popup
      window.addEventListener("message", handleMessage);
      addLog("✅ Message listener attached");

      // Monitor popup state
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          addLog("⚠️ Popup was closed");
          
          if (loading) {
            addLog("❌ Popup closed before completing auth");
            setLoading(false);
            setError("Authorization was cancelled. Please try again and make sure to approve the authorization in the popup window.");
            window.removeEventListener("message", handleMessage);
          }
        }
      }, 500);

    } catch (error) {
      addLog("❌ Connection error: " + error.message);
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
      // Transform prospects to Outreach format
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
      setError("Sync failed: " + error.message);
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
              <strong>Setup Required:</strong> In Outreach Settings → API → OAuth Applications, make sure your redirect URI matches this exactly:
              {redirectUri ? (
                <code className="text-xs bg-white px-2 py-0.5 rounded mt-1 block">
                  {redirectUri}
                </code>
              ) : (
                <span className="text-xs block mt-1">(Will be shown after clicking Connect)</span>
              )}
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

          {/* Debug Console */}
          {debugLogs.length > 0 && (
            <div className="bg-slate-900 text-green-400 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="text-xs font-mono space-y-1">
                <div className="text-slate-400 mb-1">Debug Log:</div>
                {debugLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={connectOutreach}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Waiting for authorization... (check the popup)
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect Outreach Account
              </>
            )}
          </Button>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border">
            <strong>What happens next:</strong>
            <ol className="list-decimal ml-4 mt-1 space-y-1">
              <li>A popup window will open with Outreach login</li>
              <li>Log in and approve the authorization</li>
              <li>The popup will show a success message and close automatically</li>
              <li>Watch the debug log above to see each step</li>
            </ol>
          </div>
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
              onClick={checkConnection}
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
              {error}
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
              Create/Update Prospects in Outreach
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