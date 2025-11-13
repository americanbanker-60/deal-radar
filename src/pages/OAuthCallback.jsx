import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function OAuthCallback() {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Completing authorization...");

  useEffect(() => {
    console.log("🔄 OAuthCallback page loaded");
    console.log("🔄 window.opener exists:", !!window.opener);
    console.log("🔄 window.location:", window.location.href);
    
    // Extract code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    console.log("🔄 OAuth code:", code ? "✅ Received" : "❌ Not found");
    console.log("🔄 OAuth error:", error);

    if (error) {
      console.error("❌ OAuth error:", error);
      setStatus("error");
      setMessage(`OAuth error: ${error}`);
      
      // Send error to parent window
      if (window.opener) {
        console.log("📤 Sending error message to parent");
        window.opener.postMessage({ 
          type: "outreach-oauth-error", 
          error 
        }, "*");
        
        setTimeout(() => {
          console.log("🚪 Closing popup");
          window.close();
        }, 2000);
      }
    } else if (code) {
      console.log("✅ OAuth code received, sending to parent");
      setStatus("success");
      setMessage("Authorization successful! Closing...");
      
      // Send code to parent window
      if (window.opener) {
        console.log("📤 Sending success message to parent with code");
        window.opener.postMessage({ 
          type: "outreach-oauth-success", 
          code 
        }, "*");
        
        // Close the popup after a short delay
        setTimeout(() => {
          console.log("🚪 Closing popup");
          window.close();
        }, 1500);
      } else {
        console.error("❌ No window.opener available!");
        setStatus("error");
        setMessage("Error: This page should open in a popup. Please close this window and try again.");
      }
    } else {
      console.error("❌ No code or error in URL");
      setStatus("error");
      setMessage("No authorization code received. Please close this window and try again.");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center max-w-md p-6">
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
        <p className="text-xs text-slate-500">
          {status === "error" ? "You can close this window manually." : "This window will close automatically."}
        </p>
      </div>
    </div>
  );
}