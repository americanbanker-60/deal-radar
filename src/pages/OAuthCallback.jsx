import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function OAuthCallback() {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Completing authorization...");
  const [debugInfo, setDebugInfo] = useState([]);

  const addLog = (msg) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, msg]);
  };

  useEffect(() => {
    const handleAuth = async () => {
      addLog("🔄 OAuthCallback page loaded");
      addLog("🔄 Full URL: " + window.location.href);
      addLog("🔄 Search params: " + window.location.search);
      addLog("🔄 Hash: " + window.location.hash);
      addLog("🔄 window.opener exists: " + !!window.opener);
      
      // Try to get code from query params OR hash fragment
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
      
      const code = params.get("code") || hashParams.get("code");
      const error = params.get("error") || hashParams.get("error");

      addLog("🔄 OAuth code: " + (code ? "✅ Found (" + code.substring(0, 20) + "...)" : "❌ Not found"));
      addLog("🔄 OAuth error: " + (error || "none"));

      if (error) {
        addLog("❌ OAuth error: " + error);
        setStatus("error");
        setMessage(`OAuth error: ${error}`);
        
        // Try multiple communication methods
        sendToParent({ type: "outreach-oauth-error", error });
        return;
      }
      
      if (!code) {
        addLog("❌ No code found in URL - this might be a configuration issue");
        setStatus("error");
        setMessage("No authorization code received. Please check your Outreach OAuth app settings.");
        
        addLog("💡 Checking if this is a redirect issue...");
        addLog("💡 Expected format: ?code=XXXXX");
        addLog("💡 Actual URL: " + window.location.href);
        return;
      }

      // Code found! Try to complete auth
      addLog("✅ OAuth code received!");
      setStatus("processing");
      setMessage("Exchanging code for access token...");
      
      try {
        // Complete auth directly from this window since window.opener might be null
        addLog("🔄 Calling backend to complete auth...");
        
        const result = await base44.functions.invoke('outreachCompleteAuth', { code });
        
        addLog("✅ Backend response: " + JSON.stringify(result.data));
        
        if (result.data.success) {
          addLog("🎉 Successfully connected to Outreach!");
          setStatus("success");
          setMessage("✅ Authorization successful! Redirecting...");
          
          // Send success message through multiple channels
          sendToParent({ type: "outreach-oauth-success", code });
          
          // Redirect back to main app after short delay
          setTimeout(() => {
            addLog("🔄 Redirecting to Ops Console...");
            window.location.href = "/OpsConsole";
          }, 2000);
        } else {
          throw new Error(result.data.error || "Unknown error");
        }
      } catch (error) {
        addLog("❌ Error completing auth: " + error.message);
        setStatus("error");
        setMessage("Failed to complete authorization: " + error.message);
        sendToParent({ type: "outreach-oauth-error", error: error.message });
      }
    };

    handleAuth();
  }, []);

  const sendToParent = (data) => {
    // Try multiple communication methods
    
    // Method 1: window.opener (popup)
    if (window.opener && !window.opener.closed) {
      addLog("📤 Sending via window.opener");
      try {
        window.opener.postMessage(data, "*");
        addLog("✅ Sent via window.opener");
      } catch (e) {
        addLog("❌ window.opener failed: " + e.message);
      }
    } else {
      addLog("⚠️ window.opener not available");
    }
    
    // Method 2: localStorage (fallback)
    addLog("📤 Sending via localStorage");
    try {
      localStorage.setItem('outreach_auth_result', JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
      addLog("✅ Sent via localStorage");
    } catch (e) {
      addLog("❌ localStorage failed: " + e.message);
    }
    
    // Method 3: BroadcastChannel (modern browsers)
    try {
      const channel = new BroadcastChannel('outreach_auth');
      channel.postMessage(data);
      channel.close();
      addLog("✅ Sent via BroadcastChannel");
    } catch (e) {
      addLog("⚠️ BroadcastChannel not available");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="text-center max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" 
               style={{ 
                 backgroundColor: status === "success" ? "#10b981" : status === "error" ? "#ef4444" : "#3b82f6" 
               }}>
            {status === "processing" && <Loader2 className="w-8 h-8 text-white animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-8 h-8 text-white" />}
            {status === "error" && <XCircle className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {status === "processing" && "Processing..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </h2>
          <p className="text-slate-600 mb-4">
            {message}
          </p>
          
          {/* Debug Console */}
          <div className="mt-6 bg-slate-900 text-green-400 rounded-lg p-4 text-left max-h-64 overflow-y-auto">
            <div className="text-xs font-mono space-y-1">
              <div className="text-slate-400 mb-2">Debug Console:</div>
              {debugInfo.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              {debugInfo.length === 0 && (
                <div className="text-slate-500">Waiting for logs...</div>
              )}
            </div>
          </div>
          
          {status === "error" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
              <div className="text-sm text-red-800 space-y-1">
                <strong>Troubleshooting:</strong>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Check that your Outreach OAuth app is set as "Web Application"</li>
                  <li>Verify the Redirect URI is exactly: <code className="text-xs bg-white px-1 rounded">https://deal-radar.base44.app/OAuthCallback</code></li>
                  <li>Ensure scopes include: prospects.all, sequences.read</li>
                  <li>Check the debug console above for the actual URL received</li>
                </ul>
              </div>
            </div>
          )}
          
          {status === "success" ? (
            <p className="text-xs text-slate-500 mt-4">
              Redirecting to Ops Console...
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-4">
              {status === "error" ? "You can close this window manually." : null}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}