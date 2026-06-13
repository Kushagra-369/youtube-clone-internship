import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";
import App from "./App";
createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <GoogleOAuthProvider
      clientId="923952499756-3kpfcqr5mgpbheavlqgsqd9sk8obtu6n.apps.googleusercontent.com"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);