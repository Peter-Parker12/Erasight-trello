import { randomBytes, createHash } from "crypto";

const KEY_PREFIX_LENGTH = 8;

// Generates a new API key. The full secret is shown to the user once; only
// its SHA-256 hash and a short, non-secret prefix (for display) are stored.
export const generateApiKey = () => {
  const secret = randomBytes(24).toString("base64url");
  const key = `tk_${secret}`;
  const keyPrefix = key.slice(0, KEY_PREFIX_LENGTH);
  const hashedKey = hashApiKey(key);

  return { key, keyPrefix, hashedKey };
};

export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");
