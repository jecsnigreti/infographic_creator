function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function stringToBase64Url(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return arrayBufferToBase64Url(data);
}

function base64UrlToString(base64url) {
  const buffer = base64UrlToArrayBuffer(base64url);
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const pwBytes = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const baseKey = await crypto.subtle.importKey(
    "raw",
    pwBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, storedHash) {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [saltHex, targetHex] = parts;
  
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const pwBytes = encoder.encode(password);
  
  const baseKey = await crypto.subtle.importKey(
    "raw",
    pwBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const testHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  if (testHex.length !== targetHex.length) return false;
  let result = 0;
  for (let i = 0; i < testHex.length; i++) {
    result |= testHex.charCodeAt(i) ^ targetHex.charCodeAt(i);
  }
  return result === 0;
}

export async function signJWT(payload, secret) {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(tokenInput)
  );
  
  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);
  return `${tokenInput}.${encodedSignature}`;
}

export async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const tokenInput = `${encodedHeader}.${encodedPayload}`;
    const signatureBytes = new Uint8Array(base64UrlToArrayBuffer(encodedSignature));
    
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(tokenInput)
    );
    
    if (!isValid) return null;
    
    const payloadStr = base64UrlToString(encodedPayload);
    const payload = JSON.parse(payloadStr);
    
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}
