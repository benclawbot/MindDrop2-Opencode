
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signOut as firebaseSignOut, 
  /*
   * Legacy auth imports kept for reference.
   * The current Vercel/frontend experience starts in local guest mode and does not
   * expose Google or email/password authentication.
   *
   * GoogleAuthProvider,
   * signInWithPopup,
   * createUserWithEmailAndPassword,
   * signInWithEmailAndPassword,
   * updateProfile,
   */
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";

// User provided project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBi4zIQi_SkdanyV1hcLQYBLjqrj-9t48I",
  authDomain: "to-do-8fb5e.firebaseapp.com",
  projectId: "to-do-8fb5e",
  storageBucket: "to-do-8fb5e.firebasestorage.app",
  messagingSenderId: "284174093433",
  appId: "1:284174093433:web:b73be86af339e0d75918a8",
  measurementId: "G-KS0C1W3QY2"
};

let app: any;
let auth: any = null;
let db: any = null;
// let googleProvider: any = null; // Legacy Google auth provider no longer used.

export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.apiKey !== "";

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // googleProvider = new GoogleAuthProvider(); // Legacy Google auth provider no longer used.
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
}

// Mock State for Guest Mode
let mockUser: any = JSON.parse(localStorage.getItem('minddrop-guest-user') || 'null');
let mockAuthListeners: Array<(user: any) => void> = [];

const triggerMockAuthChange = () => {
  if (mockUser) localStorage.setItem('minddrop-guest-user', JSON.stringify(mockUser));
  else localStorage.removeItem('minddrop-guest-user');
  mockAuthListeners.forEach(cb => cb(mockUser));
};

export const enterGuestMode = () => {
  const existingGuest = JSON.parse(localStorage.getItem('minddrop-guest-user') || 'null');
  mockUser = existingGuest || { 
    uid: 'guest-local', 
    displayName: 'Local Workspace', 
    email: 'local@minddrop.io',
    isGuest: true 
  };
  triggerMockAuthChange();
  return mockUser;
};

/*
 * Legacy email/password authentication kept commented for future reference.
 * The app currently bypasses the first authentication screen and uses local
 * guest mode so the Vercel-hosted frontend remains directly accessible.
 *
 * export const signUpWithEmail = async (email: string, pass: string, name: string) => {
 *   if (!isConfigured) return enterGuestMode();
 *   const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
 *   await updateProfile(userCredential.user, { displayName: name });
 *   return userCredential.user;
 * };
 *
 * export const signInWithEmail = async (email: string, pass: string) => {
 *   if (!isConfigured) return enterGuestMode();
 *   const userCredential = await signInWithEmailAndPassword(auth, email, pass);
 *   return userCredential.user;
 * };
 *
 * export const signInWithGoogle = async () => {
 *   if (!isConfigured) return enterGuestMode();
 *   try {
 *     const result = await signInWithPopup(auth, googleProvider);
 *     return result.user;
 *   } catch (error: any) {
 *     console.error("Firebase Google Sign-In Error:", error);
 *     throw error;
 *   }
 * };
 */

export const signOut = async () => {
  if (mockUser) {
    mockUser = null;
    triggerMockAuthChange();
  }
  if (isConfigured && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }
};

export const onAuthChange = (callback: (user: any) => void) => {
  if (!isConfigured) {
    mockAuthListeners.push(callback);
    callback(mockUser);
    return () => {
      mockAuthListeners = mockAuthListeners.filter(cb => cb !== callback);
    };
  }
  
  // Keep Firebase listener available for existing signed-in sessions, but default to local guest mode.
  const unsubFirebase = onAuthStateChanged(auth, (u) => {
    if (u) callback(u);
    else callback(mockUser);
  });
  
  mockAuthListeners.push(callback);
  return () => {
    unsubFirebase();
    mockAuthListeners = mockAuthListeners.filter(cb => cb !== callback);
  };
};

export { auth, db, doc, setDoc, deleteDoc, collection, onSnapshot, query, orderBy };