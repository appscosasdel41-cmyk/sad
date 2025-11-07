import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Device from 'expo-device';

// 🔹 Nombre de la tarea en segundo plano
const TASK_NAME = 'CHECK_UPDATES_TASK';

// 🔹 Páginas a monitorear
const PAGES_TO_CHECK = [
  'http://sadalmirantebrown.com.ar/',
'https://www.sadavellaneda.com.ar/index.php/repository/Comunicados',
'https://sites.google.com/abc.gob.ar/sad-berazategui/inicio/comunicados/comunicados-2025',
'https://drive.google.com/drive/folders/1rZEiIy9djcXW15dIHNzaZy8EuK4-6f0A',
'https://sadezeiza130.wixsite.com/sadezeiza',
'https://abc.gob.ar/sad/florencio-varela/comunicados-oficiales',
'http://sadsanmartin.blogspot.com/?m=1',
'https://abc.gob.ar/sad/hurlingham/comunicados-oficiales',
'https://abc.gob.ar/sad/ituzaingo/comunicados-oficiales',
'https://www.sadjosecpaz.com/comunicados-2025/',
'https://www.sadmatanza.com/secretaria2/ComunicadosS2-4-2025.html',
'https://drive.google.com/drive/folders/1WFMkB1UeLHkn3PSWly-AW_0_a-yGMgqJ',
'http://sadlanus.blogspot.com/?m=1',
'http://sadlomasdezamora.blogspot.com/?m=1',
'https://www.sad133malvinasargentinas.com/comunicados/',
'https://abc.gob.ar/sad/merlo/comunicados-oficiales',
'https://abc.gob.ar/sad//moreno/inicio',
'https://abc.gob.ar/sad/moron/comunicados-oficiales',
'https://sites.google.com/view/comunicados-de-sad-quilmes/comunicados-a%C3%B1o-2025',
'https://abc.gob.ar/sad/san-fernando/comunicados-oficiales',
'https://abc.gob.ar/sad/san-isidro/inicio',
'https://abc.gob.ar/sad/san-miguel/concursos-docentes-y-pruebas-de-seleccion',
'https://abc.gob.ar/sad/tigre/inicio',
'https://sad117.com.ar/category/concursos/',
'https://abc.gob.ar/sad//vicente-lopez/inicio',
'https://abc.gob.ar/sad/brandsen/comunicados-oficiales',
'https://abc.gob.ar/sad/san-vicente/comunicados-oficiales',
'https://sadperon.blogspot.com/',
'https://abc.gob.ar/sad/partido-de-la-costa/comunicados-oficiales',
'https://abc.gob.ar/sad/la-plata-i/comunicados-oficiales',
'https://secretariadeasuntosdocentes2laplata.blogspot.com/',
'https://www.sadlobos.com/category/cobertura-res-588603/',
'https://abc.gob.ar/sad/general-pueyrredon/comunicados-oficiales'
];

// 🔹 Palabras clave para detectar
const KEYWORDS = ['COM', 'COMUNICADO'];

// 🔹 Guardamos la última versión de cada página
let lastContents = {};

async function sendNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // inmediato
  });
}

// 🔹 Tarea en segundo plano: revisa las páginas y detecta cambios
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    for (const url of PAGES_TO_CHECK) {
      const res = await fetch(url);
      const text = await res.text();
      const containsKeyword = KEYWORDS.some(k => text.includes(k));
      
      if (containsKeyword && lastContents[url] && lastContents[url] !== text) {
        await sendNotification('Nuevo comunicado detectado', `En ${url}`);
      }

      lastContents[url] = text;
    }
    return BackgroundFetch.Result.NewData;
  } catch (err) {
    console.error('Error en background task', err);
    return BackgroundFetch.Result.Failed;
  }
});

// 🔹 Función para registrar la tarea de fondo
async function registerBackgroundTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 15 * 60, // cada 15 minutos aprox
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Tarea de fondo registrada correctamente');
    }
  } catch (err) {
    console.error('Error al registrar tarea', err);
  }
}

export default function App() {
  const [status, setStatus] = useState('Inicializando...');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('No se otorgaron permisos de notificación.');
          return;
        }

        await registerBackgroundTask();
        setStatus('Monitoreando páginas cada 15 minutos.');
      } else {
        setStatus('Debe ejecutarse en un dispositivo físico.');
      }
    })();
  }, []);

  // 🔹 Revisión manual al abrir la app
  useEffect(() => {
    const checkNow = async () => {
      for (const url of PAGES_TO_CHECK) {
        const res = await fetch(url);
        const text = await res.text();
        const containsKeyword = KEYWORDS.some(k => text.includes(k));
        lastContents[url] = text;
        if (containsKeyword) {
          setLogs(prev => [...prev, `Palabra clave detectada en ${url}`]);
        }
      }
    };
    checkNow();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛰️ Monitor de Comunicados</Text>
      <Text style={styles.status}>{status}</Text>
      <FlatList
        data={logs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={styles.log}>{item}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f7' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  status: { marginBottom: 15, fontSize: 16 },
  log: { fontSize: 14, marginBottom: 5, color: '#333' },
});
