import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const KEY = 'bloom:v1';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TASKS = [
  { id: 'water', label: 'Drink water after waking', category: 'routine', emoji: '💧' },
  { id: 'skincare', label: 'Gentle skincare', category: 'skin', emoji: '🧴' },
  { id: 'rest', label: 'Protect my sleep', category: 'sleep', emoji: '🌙' },
  { id: 'move', label: 'Move or stretch for 10 minutes', category: 'routine', emoji: '🌿' },
  { id: 'boundary', label: 'Disconnect after work', category: 'work', emoji: '🫶' },
];
const DEFAULT = { checks: {}, logs: {}, reminders: true, points: 0 };
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const isWorkDay = () => { const d = new Date().getDay(); return d >= 2 && d <= 6; };
const reminderDefinitions = [
  { key: 'wake', hour: 20, minute: 0, title: '🌷 Welcome back', body: 'A little water and a gentle start are enough today.', weekdays: [1, 2, 3, 4, 5, 6, 7] },
  { key: 'shift', hour: 1, minute: 30, title: '🌿 Your shift starts soon', body: 'Set up calmly. One task at a time.', weekdays: [3, 4, 5, 6, 7] },
  { key: 'rest', hour: 11, minute: 30, title: '🌙 Time to wind down', body: 'You deserve a quiet transition to sleep.', weekdays: [3, 4, 5, 6, 7] },
];

async function syncReminders(enabled) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('gentle-reminders', {
      name: 'Gentle reminders', importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150], sound: null,
    });
  }
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Notifications are not enabled. Allow them in Android settings.');
  for (const item of reminderDefinitions) {
    for (const weekday of item.weekdays) {
      await Notifications.scheduleNotificationAsync({
        content: { title: item.title, body: item.body, data: { bloom: item.key } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour: item.hour, minute: item.minute, channelId: 'gentle-reminders' },
      });
    }
  }
}

function Pill({ children, active, onPress }) {
  return <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}><Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text></Pressable>;
}
function Section({ title, children }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function AppContent() {
  const [state, setState] = useState(DEFAULT);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('Home');
  const [mood, setMood] = useState('');
  const [sleep, setSleep] = useState('');
  const [skin, setSkin] = useState('');
  const [note, setNote] = useState('');
  const day = todayKey();
  const checks = state.checks[day] || [];
  const log = state.logs[day] || {};
  const completed = checks.length;
  const level = Math.floor(state.points / 50) + 1;
  const plants = Math.floor(state.points / 30) + 1;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
      } catch { Alert.alert('Storage issue', 'Saved progress could not be loaded.'); }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => Alert.alert('Storage issue', 'Your progress could not be saved.'));
  }, [state, loaded]);
  useEffect(() => {
    setMood(log.mood || ''); setSleep(log.sleep == null ? '' : String(log.sleep));
    setSkin(log.skin || ''); setNote(log.note || '');
  }, [day, log.mood, log.sleep, log.skin, log.note]);

  function toggle(id) {
    setState(prev => {
      const old = prev.checks[day] || [];
      const has = old.includes(id);
      return { ...prev, checks: { ...prev.checks, [day]: has ? old.filter(x => x !== id) : [...old, id] }, points: Math.max(0, prev.points + (has ? -10 : 10)) };
    });
  }
  function saveLog() {
    const hours = sleep.trim() === '' ? null : Number(sleep);
    if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 24)) {
      Alert.alert('Check sleep hours', 'Enter a number from 0 to 24.'); return;
    }
    setState(prev => ({ ...prev, logs: { ...prev.logs, [day]: { mood, sleep: hours, skin, note: note.trim() } } }));
    Alert.alert('Saved 🌷', 'Your private daily check-in is saved on this device.');
  }
  async function changeReminders(value) {
    try {
      await syncReminders(value);
      setState(prev => ({ ...prev, reminders: value }));
      Alert.alert(value ? 'Reminders on 🌷' : 'Reminders off', value ? 'Gentle reminders are scheduled in your device’s local time.' : 'Scheduled BLOOM reminders were removed.');
    } catch (e) { Alert.alert('Reminder setup', String(e.message || e)); }
  }
  const schedule = isWorkDay()
    ? [['2:00 AM–11:00 AM', 'Work and training'], ['11:00 AM–12:00 PM', 'Meal, skincare, wind down'], ['12:00 PM–8:00 PM', 'Main sleep'], ['8:00 PM–1:30 AM', 'Dinner, self-care, free time'], ['1:30 AM–2:00 AM', 'Set up for shift']]
    : [['12:00 PM–8:00 PM', 'Protected sleep (adjust gently)'], ['8:00 PM–10:00 PM', 'Eat, movement, personal time'], ['10:00 PM onward', 'Rest, hobbies, friends or preparation']];
  if (!loaded) return <SafeAreaView style={styles.screen}><Text style={styles.loading}>Growing your space…</Text></SafeAreaView>;
  return <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}><StatusBar style="dark" />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View><Text style={styles.brand}>✿ bloom.</Text><Text style={styles.sub}>your little space to grow</Text></View><Text style={styles.date}>{DAYS[new Date().getDay()]} · {day}</Text></View>
        {tab === 'Home' && <>
          <View style={styles.hero}><Text style={styles.eyebrow}>A GENTLE REMINDER</Text><Text style={styles.heroTitle}>One little step today 🌷</Text><Text style={styles.body}>You can start again as often as you need. Your garden is still here.</Text><Text style={styles.small}>{isWorkDay() ? '🌙 Workday · 2 AM–11 AM' : '☀️ Rest day · no work missions'}</Text></View>
          <View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{completed}/{TASKS.length}</Text><Text style={styles.small}>Today’s habits</Text></View><View style={styles.stat}><Text style={styles.statValue}>Lv. {level}</Text><Text style={styles.small}>Garden level</Text></View><View style={styles.stat}><Text style={styles.statValue}>{state.points}</Text><Text style={styles.small}>Petal points</Text></View></View>
          <Section title="Little goals"><Text style={styles.helper}>Every goal is optional. Missed days never break a streak.</Text>{TASKS.map(task => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: checks.includes(task.id) }} key={task.id} style={styles.task} onPress={() => toggle(task.id)}><Text style={styles.taskEmoji}>{task.emoji}</Text><Text style={styles.taskText}>{task.label}</Text><Text style={styles.check}>{checks.includes(task.id) ? '✓' : '○'}</Text></Pressable>)}</Section>
        </>}
        {tab === 'Garden' && <>
          <View style={styles.hero}><Text style={styles.eyebrow}>YOUR LITTLE GARDEN</Text><Text style={styles.heroTitle}>Growing at your pace 🌱</Text><Text style={styles.body}>Each completed habit earns 10 petals. Every 30 petals grows a flower. No streak penalties.</Text></View>
          <View style={styles.garden}><Text style={styles.flowers}>{Array.from({ length: Math.min(plants, 15) }, (_, i) => ['🌷','🌼','🌻','🌸'][i % 4]).join(' ')}</Text><Text style={styles.statValue}>{plants} flowers · {state.points} petals</Text><Text style={styles.helper}>Level {level} · next level at {level * 50} petals</Text></View>
          <Section title="Small rewards"><Text style={styles.body}>🌱 0 petals — Welcome seed</Text><Text style={styles.body}>🌷 30 petals — First flower</Text><Text style={styles.body}>🌼 100 petals — Little meadow</Text><Text style={styles.body}>🌻 250 petals — Blooming garden</Text></Section>
        </>}
        {tab === 'Check-in' && <>
          <Section title="How are you feeling?"><Text style={styles.helper}>Your notes stay on this device. This is a wellness journal, not a medical diagnosis.</Text><View style={styles.wrap}>{['😔 Low','😐 Okay','🙂 Good','🥰 Great'].map(x => <Pill key={x} active={mood === x} onPress={() => setMood(x)}>{x}</Pill>)}</View></Section>
          <Section title="Sleep"><Text style={styles.helper}>Hours slept in your last main sleep period</Text><TextInput style={styles.input} keyboardType="decimal-pad" placeholder="e.g. 7.5" value={sleep} onChangeText={setSleep}/></Section>
          <Section title="Skin check"><View style={styles.wrap}>{['Calm','Oily','Breakout','Irritated'].map(x => <Pill key={x} active={skin === x} onPress={() => setSkin(x)}>{x}</Pill>)}</View></Section>
          <Section title="Notes"><TextInput style={[styles.input, styles.multiline]} multiline placeholder="Stress, period symptoms, or a small win…" value={note} onChangeText={setNote}/></Section>
          <Pressable style={styles.primary} onPress={saveLog}><Text style={styles.primaryText}>Save today’s check-in 🌷</Text></Pressable>
        </>}
        {tab === 'Routine' && <>
          <View style={styles.hero}><Text style={styles.eyebrow}>YOUR NIGHT-SHIFT RHYTHM</Text><Text style={styles.heroTitle}>{isWorkDay() ? 'Workday rhythm 🌙' : 'Rest-day rhythm ☀️'}</Text><Text style={styles.body}>Tuesday–Saturday: 2 AM–11 AM. Sunday and Monday: rest days.</Text></View>
          <Section title="Today’s plan">{schedule.map(([time, title]) => <View key={time} style={styles.timeline}><Text style={styles.timelineTime}>{time}</Text><Text style={styles.taskText}>{title}</Text></View>)}</Section>
          <Section title="Gentle reminders"><View style={styles.switchRow}><View style={{flex: 1}}><Text style={styles.taskText}>Android local notifications</Text><Text style={styles.helper}>8 PM wake-up daily; 1:30 AM prep and 11:30 AM wind-down on workdays</Text></View><Switch value={state.reminders} onValueChange={changeReminders} trackColor={{true:'#94b69b'}} /></View><Text style={styles.helper}>Tap the switch off and on to schedule notifications after installation. Times are based on your phone’s local timezone. Android may delay notifications due to battery settings.</Text></Section>
        </>}
        <Text style={styles.footer}>Small steps count. Rest counts too. ♡</Text>
      </ScrollView>
      <View style={styles.nav}>{[['Home','⌂'],['Routine','◷'],['Check-in','♡'],['Garden','✿']].map(([name, emoji]) => <Pressable key={name} style={styles.navItem} onPress={() => setTab(name)}><Text style={[styles.navIcon, tab === name && styles.navActive]}>{emoji}</Text><Text style={[styles.navLabel, tab === name && styles.navActive]}>{name}</Text></Pressable>)}</View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><AppContent /></SafeAreaProvider>; }
const colors = { bg: '#F9F7F1', ink: '#354C3D', muted: '#758374', green: '#E6EEDF', white: '#FFFFFF', pink: '#F4D8DE', line: '#E6E9E0' };
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.bg }, content: { padding: 20, paddingBottom: 40 }, loading: { padding: 40, color: colors.ink }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }, brand: { fontSize: 31, fontWeight: '800', color: colors.ink }, sub: { color: colors.muted, fontSize: 11 }, date: { fontSize: 11, color: colors.muted }, hero: { backgroundColor: colors.green, borderRadius: 24, padding: 22, marginBottom: 18 }, eyebrow: { fontSize: 10, fontWeight: '700', color: '#71876E', letterSpacing: 1.2, marginBottom: 10 }, heroTitle: { fontSize: 25, fontWeight: '800', color: colors.ink, marginBottom: 8 }, body: { color: colors.ink, fontSize: 14, lineHeight: 22, marginBottom: 9 }, small: { fontSize: 12, color: colors.muted }, stats: { flexDirection: 'row', gap: 9, marginBottom: 18 }, stat: { flex: 1, backgroundColor: colors.white, borderRadius: 17, padding: 12 }, statValue: { fontSize: 21, color: colors.ink, fontWeight: '800' }, section: { backgroundColor: colors.white, borderRadius: 20, padding: 17, marginBottom: 16, gap: 10 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, helper: { color: colors.muted, fontSize: 12, lineHeight: 18 }, task: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 10 }, taskEmoji: { fontSize: 22 }, taskText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20 }, check: { fontSize: 24, color: '#7FA487' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, pill: { backgroundColor: colors.bg, borderRadius: 22, paddingHorizontal: 13, paddingVertical: 11 }, pillActive: { backgroundColor: colors.pink }, pillText: { color: colors.ink, fontSize: 13 }, pillTextActive: { fontWeight: '800' }, input: { backgroundColor: colors.bg, borderRadius: 12, padding: 13, fontSize: 15, color: colors.ink }, multiline: { height: 100, textAlignVertical: 'top' }, primary: { backgroundColor: '#527B5C', borderRadius: 15, padding: 16, alignItems: 'center', marginBottom: 16 }, primaryText: { color: '#FFF', fontWeight: '800' }, garden: { backgroundColor: colors.pink, padding: 25, borderRadius: 20, marginBottom: 16, gap: 12, alignItems: 'center' }, flowers: { fontSize: 35, textAlign: 'center', lineHeight: 48 }, timeline: { borderLeftWidth: 3, borderLeftColor: '#A9C4A9', paddingLeft: 12, paddingVertical: 10 }, timelineTime: { fontSize: 12, color: colors.muted, marginBottom: 4 }, switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, footer: { textAlign: 'center', color: colors.muted, marginTop: 10 }, nav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.white, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.line }, navItem: { alignItems: 'center', minWidth: 60 }, navIcon: { fontSize: 24, color: colors.muted }, navLabel: { fontSize: 11, color: colors.muted }, navActive: { color: '#477D56', fontWeight: '800' } });
