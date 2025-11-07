import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = "@sadwatcher:";

export async function getSeen(url) {
  const v = await AsyncStorage.getItem(PREFIX + url);
  return v; // null o string almacenado
}

export async function setSeen(url, value) {
  await AsyncStorage.setItem(PREFIX + url, value);
}

export async function getAllSeen() {
  const keys = await AsyncStorage.getAllKeys();
  const sadKeys = keys.filter(k => k.startsWith(PREFIX));
  const pairs = await AsyncStorage.multiGet(sadKeys);
  const map = {};
  pairs.forEach(([k, v]) => {
    map[k.substring(PREFIX.length)] = v;
  });
  return map;
}
