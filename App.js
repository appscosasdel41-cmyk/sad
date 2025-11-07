import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import { registerBackgroundTask, TASK_NAME } from './backgroundTask';
import { getAllSeen } from './storage';
import URLS from './urls';

export default function App() {
  const [registered, setRegistered] = useState(false);
  const [seen, setSeen] = useState({});

  useEffect(() => {
    // Configurar comportamiento de notificaciones en primer plano
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false
      })
    });

    (async () => {
      // Pedir permiso para notificaciones
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permiso denegado", "Necesitamos permiso para enviarte notificaciones.");
      }
      // Registrar tarea en background
      const ok = await registerBackgroundTask();
      setRegistered(ok);
      const s = await getAllSeen();
      setSeen(s);
    })();

    // Listener para cuando el usuario abre la notificación
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      // Podés navegar a una pantalla concreta; por simplicidad solo alert
      Alert.alert("Notificación abierta", JSON.stringify(data?.updates?.length ? data.updates : { msg: "Abrir app" }));
    });

    return () => subscription.remove();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 10 }}>SAD Watcher</Text>
      <Text>Registro background: {registered ? "OK" : "NO (ver permisos/OS)"}</Text>
      <Text style={{ marginTop: 10, fontWeight: '600' }}>Monitoreando {URLS.length} URLs</Text>

      <View style={{ marginTop: 12 }}>
        <Button title="Forzar chequeo ahora" onPress={async () => {
          // Forzar la tarea definida (solo en foreground)
          // IMPORTANTE: la tarea se definió en backgroundTask; aquí hacemos una llamada simple
          try {
            // simulamos llamada a la task
            const res = await fetch(URLS[0]); // pequeño ping para forzar permisos; mejor usar un endpoint server-side en producción
            Alert.alert('Chequeo forzado', 'Se hizo un ping. Para ver notificaciones reales revisa backgroundTask.');
          } catch (e) {
            Alert.alert('Error', String(e));
          }
        }}/>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: '600' }}>Historial (fingerprints guardados):</Text>
        {Object.keys(seen).length === 0 ? <Text style={{ marginTop: 8 }}>Sin datos guardados aún.</Text> :
          Object.entries(seen).map(([url, val]) => (
            <View key={url} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12 }}>{url}</Text>
              <Text style={{ fontSize: 11, color: '#666' }}>{val.slice(0, 80)}...</Text>
            </View>
          ))
        }
      </View>

      <View style={{ height: 40 }} />
      <Text style={{ fontSize: 12, color: '#888' }}>Nota: iOS restringe fuertemente las tareas en background. Para comprobaciones fiables y en tiempo real recomendamos complementar con un servidor que haga polling y use un push service.</Text>
    </ScrollView>
  );
}

