
# Smart To Do AI

This is a React application powered by the Google Gemini API.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory and add your API Key:
   ```
   VITE_API_KEY=your_gemini_api_key_here
   ```
   *(Note: You will need to update `services/gemini.ts` to use `import.meta.env.VITE_API_KEY` instead of `process.env.API_KEY` for Vite compatibility).*

3. Run development server:
   ```bash
   npm run dev
   ```

## Building an APK (Android)

To turn this into a mobile app, use [Capacitor](https://capacitorjs.com/).

1. Initialize Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   ```

2. Build the React project:
   ```bash
   npm run build
   ```

3. Add Android platform:
   ```bash
   npx cap add android
   ```

4. Sync the build:
   ```bash
   npx cap sync
   ```

5. Open in Android Studio:
   ```bash
   npx cap open android
   ```

6. From Android Studio, you can run the app on an emulator or generate a signed APK/Bundle under the "Build" menu.

## Google Auth & Database

To add Google Auth and Database persistence (e.g., Firebase):

1. **Firebase Setup**:
   - Create a Firebase project.
   - Enable Authentication (Google Provider).
   - Enable Firestore Database.
   - Install Firebase SDK: `npm install firebase`.

2. **Integration**:
   - Initialize Firebase in a new `services/firebase.ts` file.
   - Update `App.tsx` to listen for auth state changes.
   - Replace the `localStorage` logic in `App.tsx` with Firestore `onSnapshot` listeners to sync tasks across devices.
