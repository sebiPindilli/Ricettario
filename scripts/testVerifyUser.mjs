// Test isolato per lo step M.1 — verifica un ID token reale contro
// verifyUser(). Uso:
//   node --env-file=.env.local scripts/testVerifyUser.mjs <ID_TOKEN>
import { verifyUser } from "../lib/auth.js";

const token = process.argv[2];
if (!token) {
  console.error("Uso: node --env-file=.env.local scripts/testVerifyUser.mjs <ID_TOKEN>");
  process.exit(1);
}

try {
  const result = await verifyUser(token);
  console.log("✅ Autorizzato:", result);
} catch (err) {
  console.log("❌ Rifiutato:", err.message);
}
