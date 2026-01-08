# Paylap Fitness Kiosk - Quick Reference

## 🚀 Start Development
```bash
cd paylap-fitness-kiosk
npm start
```

## 📱 Test on Device
- Scan QR code with Expo Go app
- Or press `a` for Android emulator

## ⚙️ Configure Before Deploy

Edit `constants/config.ts`:
```typescript
relay: {
  ip: '192.168.1.51',  // ← Your relay server IP
}
```

## 📋 Complete Flow
1. Member shows face to camera
2. Press "Scan Face"
3. VPS verifies (2-3s)
4. If approved → Unlock door (offline)
5. Show welcome screen
6. Auto-return to camera

## 🔧 Next: Phase 2
Convert `relay.js` to HTTP server for door control.

See [walkthrough.md](file:///Users/arbaz/.gemini/antigravity/brain/3d93d867-f537-43af-aef2-ed032d7466a2/walkthrough.md) for complete details.
