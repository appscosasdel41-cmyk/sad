import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { getSeen, setSeen } from './storage';
import URLS from './urls';

// Palabras clave (puedes agregar)
const KEYWORDS = ["COMUNICAD", "COM " , "COMUNICADO", "COMUNICADOS", "comunicado", "comunicados", "Comunicado", "COM"];

function snippetFromHtml(html) {
  // Devuelve una versión corta para mostrar en notificación
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return txt.slice(0, 220);
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'GET' , headers: { 'Accept': 'text/html' }});
    if (!res.ok) return null;
    const html = await res.text();
    // Buscamos si aparece alguna de las KEYWORDS
    const lower = html.toLowerCase();
    const found = KEYWORDS.some(k => lower.includes(k.toLowerCase()));
    if (!found) return null;

    // Generamos un simple "fingerprint" para detectar cambios: hash por substring
    const fingerprint = (html.length + "|" + html.slice(0, 500)).slice(0, 1000);
    const prev = await getSeen(url);
    if (prev && prev === fingerprint) {
      return null; // no cambió
    }
    // guardamos y devolvemos snippet
    await setSeen(url, fingerprint);
    return { url, snippet: snippetFromHtml(html) };
  } catch (e) {
    // silenciosamente fallamos (podés loggear)
    return null;
  }
}

export const TASK_NAME = 'SAD_WATCHER_TASK';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const results = [];
    for (const url of URLS) {
      const r = await checkUrl(url);
      if (r) results.push(r);
    }

    if (results.length > 0) {
      // Si hay varios cambios, los agrupamos en una notificación
      const body = results.length === 1
        ? `Nuevo comunicado en ${results[0].url}\n\n${results[0].snippet}`
        : `${results.length} actualizaciones detectadas. Abre la app para verlos.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "SAD Watcher — Nuevos comunicados",
          body: body,
          data: { updates: results }
        },
        trigger: null // notificación inmediata
      });
    }

    return BackgroundFetch.Result.NewData;
  } catch (error) {
    return BackgroundFetch.Result.Failed;
  }
});

export async function registerBackgroundTask() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.Status.Restricted || status === BackgroundFetch.Status.Denied) {
      // No se puede registrar, el usuario / OS bloqueó background fetch.
      return false;
    }

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60 * 15, // 15 minutos (sujeto a limitaciones del OS)
      stopOnTerminate: false,
      startOnBoot: true,
    });
    return true;
  } catch (err) {
    return false;
  }
}
