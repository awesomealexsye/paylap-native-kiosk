# Paylap Fitness Kiosk App

Face detection check-in system for gym access control.

## Features

- ✅ Front-facing camera for face capture
- ✅ VPS face verification (Laravel + Python)
- ✅ **Offline relay control** (local WiFi)
- ✅ Automatic door unlock on success
- ✅ Welcome screen with member name
- ✅ Clean, modern UI

## Tech Stack

- **Expo SDK**: 54.0
- **React Native**: 0.81
- **Navigation**: expo-router
- **Camera**: expo-camera
- **HTTP**: axios

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app

## Configuration

Edit `constants/config.ts` to configure:

- **VPS API URL** - Your Laravel backend
- **Relay Server IP** - Local relay server on WiFi
- **Gym ID & Device ID** - Set via QR code setup

## Project Structure

```
app/
├── _layout.tsx          # Root navigation
├── index.tsx            # Camera/scan screen
└── welcome.tsx          # Success screen

services/
├── relayService.ts      # Relay HTTP API (offline)
└── faceVerifyService.ts # VPS face verification

constants/
└── config.ts            # App configuration
```

## Complete Flow

1. Member stands in front of camera
2. Press "Scan Face" button
3. Image sent to VPS for verification (2-3s)
4. If verified:
   - Show welcome message
   - Call local relay to unlock door (offline)
   - Door unlocks for 3 seconds
5. Auto-return to camera screen

## Building APK

```bash
# Build for Android
npx expo build:android

# Or use EAS Build
npx eas build --platform android
```

## Relay Server Setup

The relay control happens via a local Node.js HTTP server.

**See Phase 2** in implementation plan for relay server setup.

## Next Steps

- [ ] Setup Laravel API endpoint for face verification
- [ ] Setup Python face recognition service  
- [ ] Create relay HTTP server from existing relay.js
- [ ] Test complete flow
- [ ] Deploy to production

## Notes

- Relay control works **100% offline** on local WiFi
- Only face verification requires internet
- Camera permission required on first launch
- Default unlock duration: 3 seconds
