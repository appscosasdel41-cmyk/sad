const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Palabras clave a buscar
const KEYWORDS = ["COMUNICAD", "COM " , "COMUNICADO", "COMUNICADOS"];
const URLS = [/* las URLs que me diste */];

async function checkUrl(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const lower = html.toLowerCase();
    const found = KEYWORDS.some(k => lower.includes(k.toLowerCase()));
    if (!found) return null;
    const fingerprint = (html.length + "|" + html.slice(0, 500)).slice(0, 1000);
    const prev = (await db.collection("pages").doc(encodeURIComponent(url)).get()).data();
    if (prev && prev.hash === fingerprint) return null;
    await db.collection("pages").doc(encodeURIComponent(url)).set({ hash: fingerprint, updated: Date.now() });
    return url;
  } catch (e) {
    console.log("Error en", url, e.message);
    return null;
  }
}

exports.checkSites = functions.pubsub.schedule("every 15 minutes").onRun(async () => {
  const changed = [];
  for (const url of URLS) {
    const result = await checkUrl(url);
    if (result) changed.push(result);
  }

  if (changed.length > 0) {
    // Enviamos notificación push a todos los tokens registrados
    const tokensSnap = await db.collection("tokens").get();
    const tokens = tokensSnap.docs.map(d => d.id);
    const message = {
      notification: {
        title: "Nuevos comunicados",
        body: `Se actualizaron ${changed.length} sitios SAD.`,
      },
      data: { urls: JSON.stringify(changed) },
      tokens
    };
    await admin.messaging().sendMulticast(message);
  }

  return null;
});
