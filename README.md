# BLOOM — Android-first personal life companion (MVP v1)

A cozy offline-first Expo / React Native app for gentle habits, night-shift planning, mood, sleep, skin journaling, and a growing garden. No account or backend needed.

## Requirements
- Node.js 20+ and npm
- Android phone with **Expo Go** for development, or Android emulator
- Android Studio for emulator (optional)

## Run
```bash
cd bloom-android
npm install
npx expo install --fix
npx expo start --android
```
For a physical phone, run `npx expo start` and scan the QR code with Expo Go. Phone and computer should usually be on the same network. `npx expo install --fix` aligns Expo-compatible dependency versions.

## Make an installable APK (later)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```
Add this `eas.json` in the project root first:
```json
{"build":{"preview":{"android":{"buildType":"apk"}}}}
```
This needs an Expo account and an EAS cloud build; Expo Go is sufficient for initial testing. Some notification behaviors may differ between Expo Go and standalone Android builds.

## Features
- **Home:** 5 optional daily habits, each worth 10 petal points. Unchecking subtracts 10; points never go below 0.
- **Garden:** 1 flower plus 1 for every 30 petals, levels increase every 50 petals; no streak loss.
- **Check-in:** mood, last main sleep hours, skin status, optional private note.
- **Routine:** work Tue–Sat 2–11 AM, rest Sun–Mon; sleep goal noon–8 PM.
- **Reminders:** local weekly Android notifications. Daily 8 PM wake-up, workdays 1:30 AM shift preparation and 11:30 AM wind-down. Weekday numbering follows Expo's Sunday=1 through Saturday=7. Reminder schedule is created when toggled on, not automatically at first launch. This avoids requesting permissions unexpectedly.
- **Storage:** AsyncStorage key `bloom:v1`, JSON on device. Data survives app restarts, but may be lost when uninstalling or clearing app data. It is not encrypted or cloud-synced; avoid recording sensitive medical details on shared devices.

## Limitations and next steps
1. **Test Android notifications on a physical device**. Some Android versions, battery savers and OEM settings delay notifications. No exact-alarm permission is requested; these are gentle reminders.
2. Add configurable sleep times, reminder times, and timezone travel behavior. Current times are fixed to the user's proposed Philippine schedule.
3. Add calendar view, period tracking with optional symptom fields, and CSV export/delete-data controls. Do not diagnose PCOS from tracking data.
4. Add weekly summaries, achievements, themed plants, and optional gentle recovery quests.
5. Add accessibility polish, tests, a privacy notice, and encrypted local storage before collecting sensitive health data.
6. Consider background-safe rescheduling after device reboot/timezone change and notification permission changes. Validate behavior in standalone APK.

## Product principle
No streak guilt, no punishment for missed days, no work notifications on rest days. Reminders must never interrupt protected sleep.
