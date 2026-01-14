# Device Testing Configuration

## Pixel 9a Specifications
- Screen Size: 6.3 inches
- Resolution: 2424 x 1080 pixels
- Aspect Ratio: 20:9
- Pixel Density: ~431 ppi
- Display Type: OLED

## Testing on Pixel 9a

### Using Android Studio Emulator
1. Open Android Studio
2. Go to Tools > Device Manager
3. Click "Create Device"
4. Select or create custom device with these specs:
   - Screen Size: 6.3"
   - Resolution: 2424 x 1080
   - RAM: 8GB
   - Android API: 33 or higher

### Using Expo on Physical Pixel 9a
1. Enable Developer Mode on Pixel 9a
2. Connect via USB or scan QR code
3. App will automatically match device dimensions

### Current Configuration
The app is configured for:
- Portrait orientation (locked)
- Edge-to-edge display
- Dark theme optimized
- Status bar integration

The React Native app automatically adapts to the device's screen dimensions, so it will work perfectly on Pixel 9a without additional configuration.
