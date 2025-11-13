import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function OAuthCallback() {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Completing authorization...");
  const [debugInfo, setDebugInfo] = useState([]);

  const addLog = (msg) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, msg]);
  };

  useEffect(() => {
    addLog("🔄 OAuthCallback page loaded");
    addLog("🔄 window.opener exists: " + !!window.opener);
    addLog("🔄 window.location: " + window.location.href);
    
    // Extract code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    addLog("🔄 OAuth code: " + (code ? "✅ Received (" + code.substring(0, 20) + "...)" : "❌ Not found"));
    addLog("🔄 OAuth error: " + (error || "none"));

    if (error) {
      addLog("❌ OAuth error: " + error);
      setStatus("error");
      setMessage(`OAuth error: ${error}`);
      
      if (window.opener) {
        addLog("📤 Sending error message to parent");
        window.opener.postMessage({ 
          type: "outreach-oauth-error", 
          error 
        }, "*");
      }
      
      // Don't auto-close on error, let user see what happened
      return;
    }
    
    if (code) {
      addLog("✅ OAuth code received!");
      setStatus("success");
      setMessage("Authorization successful! Sending code to parent window...");
      
      if (window.opener && !window.opener.closed) {
        addLog("📤 Sending success message to parent with code");
        
        // Send message multiple times to ensure it gets through
        const sendMessage = () => {
          try {
            window.opener.postMessage({ 
              type: "outreach-oauth-success", 
              code 
            }, "*");
            addLog("✅ Message sent successfully");
          } catch (e) {
            addLog("❌ Error sending message: " + e.message);
          }
        };
        
        // Send immediately
        sendMessage();
        
        // Send again after 100ms
        setTimeout(sendMessage, 100);
        
        // Send again after 300ms
        setTimeout(sendMessage, 300);
        
        // Wait 2 seconds before allowing close
        setTimeout(() => {
          addLog("⏰ 2 seconds elapsed, safe to close now");
          setMessage("✅ Code sent! You can close this window or it will close automatically.");
          
          // Auto-close after another 2 seconds
          setTimeout(() => {
            addLog("🚪 Attempting to close popup");
            try {
              window.close();
              addLog("✅ Window close initiated");
            } catch (e) {
              addLog("❌ Could not close window: " + e.message);
              setMessage("Please close this window manually.");
            }
          }, 2000);
        }, 2000);
      } else {
        addLog("❌ No window.opener available or opener was closed");
        setStatus("error");
        setMessage("Error: This page should open in a popup. The parent window is not available. Please close this window and try again.");
      }
    } else {
      addLog("❌ No code or error in URL");
      setStatus("error");
      setMessage("No authorization code received. Please close this window and try again.");
    }
  }, []);

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
          
          <p className="text-xs text-slate-500 mt-4">
            {status === "error" ? "You can close this window manually." : "This window will close automatically in a few seconds."}
          </p>
        </div>
      </div>
    </div>
  );
}