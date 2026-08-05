import { verifyUser } from "../lib/auth.js";
import { parseRecipeFromLink } from "../lib/gemini.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let user;
  try {
    user = await verifyUser(req.body?.idToken);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  try {
    const recipe = await parseRecipeFromLink({ url: req.body?.url, text: req.body?.text });
    return res.status(200).json({ recipe });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
