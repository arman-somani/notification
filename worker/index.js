const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const permitted = !allowed.length || allowed.includes("*") || allowed.includes(origin);
  return {
    "access-control-allow-origin": permitted ? (allowed.includes("*") || !allowed.length ? "*" : origin) : "null",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization,content-type",
    "access-control-max-age": "86400",
    "access-control-expose-headers": "content-type",
    "vary": "Origin",
  };
}

function jsonResponse(request, env, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(request, env) },
  });
}

function errorResponse(request, env, message, status = 400, code = "request_failed") {
  return jsonResponse(request, env, { error: message, code }, status);
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

async function verifyFirebaseToken(idToken, env) {
  if (!idToken) throw new Error("Sign in again before sharing media.");
  if (!env.FIREBASE_WEB_API_KEY || !env.FIREBASE_PROJECT_ID) {
    throw new Error("The Cloudflare Worker is missing its Firebase configuration.");
  }

  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(env.FIREBASE_WEB_API_KEY),
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: idToken }),
    },
  );
  const result = await response.json().catch(() => ({}));
  const uid = result && result.users && result.users[0] && result.users[0].localId;
  if (!response.ok || !uid) {
    throw new Error("Your sign-in token is invalid or expired. Sign in again.");
  }
  return uid;
}

async function firestoreGet(path, idToken, env) {
  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(env.FIREBASE_PROJECT_ID) +
    "/databases/(default)/documents/" + path;
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + idToken },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error((body && body.error && body.error.message) || "Firestore denied the media request.");
    error.status = response.status;
    error.code = (body && body.error && body.error.status) || "FIRESTORE_READ_FAILED";
    throw error;
  }
  return body;
}

function firestoreField(document, field, type = "stringValue") {
  return document && document.fields && document.fields[field]
    ? document.fields[field][type]
    : undefined;
}

async function firestoreGetIfExists(path, idToken, env) {
  try {
    return await firestoreGet(path, idToken, env);
  } catch (error) {
    if (error && error.status === 404) return null;
    throw error;
  }
}

async function requireConversationMember(conversationId, uid, idToken, env) {
  const document = await firestoreGet(
    "conversations/" + encodeURIComponent(conversationId),
    idToken,
    env,
  );
  const members = document && document.fields && document.fields.memberIds &&
    document.fields.memberIds.arrayValue && document.fields.memberIds.arrayValue.values || [];
  const memberIds = members.map((entry) => entry.stringValue).filter(Boolean);
  if (!memberIds.includes(uid)) {
    const error = new Error("You are not a member of this conversation.");
    error.status = 403;
    error.code = "NOT_CONVERSATION_MEMBER";
    throw error;
  }
  return document;
}

async function requireNotBlocked(conversationDocument, uid, idToken, env) {
  const values = conversationDocument && conversationDocument.fields &&
    conversationDocument.fields.memberIds && conversationDocument.fields.memberIds.arrayValue &&
    conversationDocument.fields.memberIds.arrayValue.values || [];
  const memberIds = values.map((entry) => entry.stringValue).filter(Boolean);
  if (memberIds.length !== 2) return
  const otherUid = memberIds.find((memberUid) => memberUid !== uid)
  if (!otherUid) return
  const [myBlock, theirBlock] = await Promise.all([
    firestoreGetIfExists("users/" + encodeURIComponent(uid) + "/blocks/" + encodeURIComponent(otherUid), idToken, env),
    firestoreGetIfExists("users/" + encodeURIComponent(otherUid) + "/blocks/" + encodeURIComponent(uid), idToken, env),
  ])
  if (myBlock || theirBlock) {
    const error = new Error("Media is unavailable because one of these accounts has blocked the other.");
    error.status = 403;
    error.code = "BLOCKED_CONVERSATION";
    throw error;
  }
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha1(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function safeFileExtension(contentType) {
  const types = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return types[contentType] || "";
}

async function uploadToImageKit(file, conversationId, messageId, env) {
  if (!env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("The Cloudflare Worker is missing its ImageKit public/private key configuration.");
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 5 * 60;
  const signature = await hmacSha1(env.IMAGEKIT_PRIVATE_KEY, token + String(expire));
  const extension = safeFileExtension(file.type);
  const form = new FormData();

  form.set("file", file, messageId + "." + extension);
  form.set("fileName", messageId + "." + extension);
  form.set("folder", "/notification/" + conversationId);
  form.set("useUniqueFileName", "false");
  form.set("isPrivateFile", "true");
  form.set("publicKey", env.IMAGEKIT_PUBLIC_KEY);
  form.set("token", token);
  form.set("expire", String(expire));
  form.set("signature", signature);

  const response = await fetch("https://upload.imagekit.io/api/v2/files/upload", {
    method: "POST",
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.filePath || !body.url) {
    const error = (body && (body.message || body.help)) || "ImageKit rejected the image upload.";
    throw new Error(error);
  }
  return {
    filePath: body.filePath,
    fileId: body.fileId || "",
    name: body.name || (messageId + "." + extension),
    mimeType: file.type,
  };
}

async function getPrivateImage(filePath, env) {
  if (!env.IMAGEKIT_PRIVATE_KEY || !env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error("The Cloudflare Worker is missing its ImageKit delivery configuration.");
  }
  const endpoint = env.IMAGEKIT_URL_ENDPOINT.replace(/\/+$/, "");
  const relativePath = filePath.replace(/^\/+/, "");
  if (!relativePath || relativePath.includes("..")) {
    throw new Error("The stored image path is invalid.");
  }

  const imageUrl = endpoint + "/" + relativePath;
  const expire = Math.floor(Date.now() / 1000) + 90;
  const signature = await hmacSha1(env.IMAGEKIT_PRIVATE_KEY, relativePath + String(expire));
  const signedUrl = imageUrl + "?ik-t=" + expire + "&ik-s=" + signature;
  const response = await fetch(signedUrl, { headers: { "cache-control": "no-cache" } });
  if (!response.ok) {
    throw new Error("ImageKit could not deliver this image (HTTP " + response.status + ").");
  }
  return response;
}

async function markRecipientView(conversationId, messageId, uid, idToken, env) {
  const base = "projects/" + env.FIREBASE_PROJECT_ID +
    "/databases/(default)/documents/conversations/" + conversationId + "/messages/" + messageId;
  const viewName = base + "/views/" + uid;
  const endpoint = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(env.FIREBASE_PROJECT_ID) + "/databases/(default)/documents:commit";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + idToken,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: viewName,
            fields: {
              viewerUid: { stringValue: uid },
              viewedAt: { timestampValue: new Date().toISOString() },
            },
          },
          currentDocument: { exists: false },
        },
        {
          transform: {
            document: base,
            fieldTransforms: [{
              fieldPath: "viewedByUids",
              appendMissingElements: { values: [{ stringValue: uid }] },
            }],
          },
          currentDocument: { exists: true },
        },
      ],
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const alreadyOpened = response.status === 409 || response.status === 412;
    const message = alreadyOpened
      ? "This image has already been opened on this account."
      : result && result.error && result.error.message || "Could not claim this one-time image view.";
    const error = new Error(message);
    error.status = alreadyOpened ? 410 : response.status;
    error.code = alreadyOpened ? "image_already_opened" : (result && result.error && result.error.status || "IMAGE_VIEW_CLAIM_FAILED");
    throw error;
  }
}

async function handleUpload(request, env) {
  const idToken = getBearerToken(request);
  const uid = await verifyFirebaseToken(idToken, env);
  const form = await request.formData();
  const conversationId = String(form.get("conversationId") || "");
  const messageId = String(form.get("messageId") || "");
  const file = form.get("file");

  if (!/^[A-Za-z0-9_-]{5,160}$/.test(conversationId) || !/^[A-Za-z0-9_-]{8,160}$/.test(messageId)) {
    return errorResponse(request, env, "Conversation or message ID is invalid.", 400, "invalid_path");
  }
  if (!(file instanceof File)) {
    return errorResponse(request, env, "Choose an image before uploading.", 400, "missing_image");
  }
  if (!safeFileExtension(file.type) || file.size < 1 || file.size > 3 * 1024 * 1024) {
    return errorResponse(request, env, "Choose a JPG, PNG, WEBP or GIF image smaller than 3 MB.", 400, "invalid_image");
  }

  const conversationDocument = await requireConversationMember(conversationId, uid, idToken, env);
  await requireNotBlocked(conversationDocument, uid, idToken, env);
  const uploaded = await uploadToImageKit(file, conversationId, messageId, env);
  return jsonResponse(request, env, {
    filePath: uploaded.filePath,
    fileId: uploaded.fileId,
    mimeType: uploaded.mimeType,
  }, 201);
}

async function handleOpen(request, env) {
  const idToken = getBearerToken(request);
  const uid = await verifyFirebaseToken(idToken, env);
  const payload = await request.json().catch(() => ({}));
  const conversationId = String(payload.conversationId || "");
  const messageId = String(payload.messageId || "");

  if (!/^[A-Za-z0-9_-]{5,160}$/.test(conversationId) || !/^[A-Za-z0-9_-]{8,160}$/.test(messageId)) {
    return errorResponse(request, env, "Conversation or message ID is invalid.", 400, "invalid_path");
  }

  const conversationDocument = await requireConversationMember(conversationId, uid, idToken, env);
  await requireNotBlocked(conversationDocument, uid, idToken, env);
  const messageDocument = await firestoreGet(
    "conversations/" + encodeURIComponent(conversationId) + "/messages/" + encodeURIComponent(messageId),
    idToken,
    env,
  );
  const type = firestoreField(messageDocument, "type");
  const senderId = firestoreField(messageDocument, "senderId");
  const filePath = firestoreField(messageDocument, "attachmentPath");
  const viewOnce = firestoreField(messageDocument, "viewOnce", "booleanValue");
  const expiresAt = firestoreField(messageDocument, "expiresAt", "timestampValue");

  if (type !== "image" || viewOnce !== true || !filePath) {
    return errorResponse(request, env, "This image message is incomplete or unavailable.", 404, "image_not_found");
  }
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    return errorResponse(request, env, "This image has expired.", 410, "image_expired");
  }

  const viewPath = "conversations/" + encodeURIComponent(conversationId) +
    "/messages/" + encodeURIComponent(messageId) + "/views/" + encodeURIComponent(uid);
  const priorView = await firestoreGetIfExists(viewPath, idToken, env);
  if (priorView) {
    return errorResponse(request, env, "This image has already been opened on this account.", 410, "image_already_opened");
  }

  // Every member, including the sender, gets one account-level view. The
  // conditional create and viewer-list transform prevent duplicate opens.
  const imageResponse = await getPrivateImage(filePath, env);
  await markRecipientView(conversationId, messageId, uid, idToken, env);

  const headers = {
    ...corsHeaders(request, env),
    "content-type": imageResponse.headers.get("content-type") || "application/octet-stream",
    "cache-control": "no-store, private, max-age=0",
    "x-content-type-options": "nosniff",
    "content-disposition": "inline",
  };
  return new Response(imageResponse.body, { status: 200, headers: headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse(request, env, { ok: true, service: "notification-api" });
    }

    try {
      if (url.pathname === "/media/upload" && request.method === "POST") {
        return await handleUpload(request, env);
      }
      if (url.pathname === "/media/open" && request.method === "POST") {
        return await handleOpen(request, env);
      }
      return errorResponse(request, env, "Route not found.", 404, "not_found");
    } catch (error) {
      const status = Number(error && error.status) || 500;
      return errorResponse(
        request,
        env,
        error && error.message || "The media request failed.",
        status,
        error && error.code || "media_request_failed",
      );
    }
  },
};
