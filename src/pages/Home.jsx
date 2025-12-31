import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to OpsConsole as the main landing page
    navigate(createPageUrl("OpsConsole"), { replace: true });
  }, [navigate]);

  return null;
}