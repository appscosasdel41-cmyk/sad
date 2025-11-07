# SAD Watcher (Expo)

App móvil (Android / iOS) para detectar comunicaciones en páginas web y avisar con notificaciones.

## Qué hace
- Revisa periódicamente una lista de URLs.
- Busca palabras clave (COM, COMUNICADO, etc).
- Si detecta contenido nuevo que contiene esas palabras, envía una notificación local.

## Requisitos
- Node.js (>= 16 recomendado)
- Expo CLI (`npm install -g expo-cli`)
- Un dispositivo Android o iOS (o emulador). Para notificaciones en iOS real y background fetch real conviene subir a TestFlight / build nativo.

## Instalación rápida
```bash
git clone <TU_REPO>
cd sad-watcher
npm install
expo start
