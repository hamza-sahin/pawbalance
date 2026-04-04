#!/usr/bin/env node
/**
 * Refresh OAuth credentials for the PawBalance AI agent.
 * Opens a browser for Anthropic OAuth login and saves tokens to auth.json.
 *
 * Usage: node scripts/refresh-auth.mjs
 */

import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { webcrypto } from "node:crypto";

const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const AUTHORIZE_URL = "https://claude.ai/oauth/authorize";
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
const CALLBACK_PORT = 53692;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;
const SCOPES =
  "org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload";

const AUTH_PATH = join(process.cwd(), "auth.json");

// PKCE generation
async function generatePKCE() {
  const array = new Uint8Array(32);
  webcrypto.getRandomValues(array);
  const verifier = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await webcrypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, challenge };
}

async function main() {
  const { verifier, challenge } = await generatePKCE();

  // Start callback server
  const { code, state } = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || "", "http://localhost");
      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400);
        res.end(`OAuth error: ${error}`);
        reject(new Error(`OAuth error: ${error}`));
        server.close();
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h1>Authentication successful!</h1><p>You can close this window.</p>");
      resolve({ code, state: stateParam });
      server.close();
    });

    server.listen(CALLBACK_PORT, "127.0.0.1", () => {
      const authParams = new URLSearchParams({
        code: "true",
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: verifier,
      });

      const authUrl = `${AUTHORIZE_URL}?${authParams.toString()}`;
      console.log("\nOpen this URL in your browser to authenticate:\n");
      console.log(authUrl);
      console.log("\nWaiting for callback...");

      // Try to open browser automatically
      import("node:child_process").then(({ exec }) => {
        exec(`open "${authUrl}"`);
      });
    });

    server.on("error", reject);
  });

  // Exchange code for tokens
  console.log("\nExchanging code for tokens...");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      state,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error("Token exchange failed:", body);
    process.exit(1);
  }

  const tokenData = JSON.parse(body);
  const authData = {
    anthropic: {
      type: "oauth",
      refresh: tokenData.refresh_token,
      access: tokenData.access_token,
      expires: Date.now() + tokenData.expires_in * 1000 - 5 * 60 * 1000,
    },
  };

  writeFileSync(AUTH_PATH, JSON.stringify(authData, null, 2));
  console.log("\nauth.json updated successfully!");
  console.log("Token expires:", new Date(authData.anthropic.expires).toISOString());
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
