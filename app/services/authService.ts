import {
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser,
  UserCredential,
  getAuth,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";


import { COLLECTION, USER_ROLE} from "@/app/types/constants";
import { fail, ok, Result } from "@/app/utils/response";
import { logError } from "@/app/utils/logger";

import { userService } from "./userService";
import { UserRole } from "@/app/types/general";
import { auth,db } from "../lib/firebaseClient";

class AuthService {



  /**
 * Signs in a user using Google Sign-In (Popup) via Firebase Auth.
 * If the user does not already exist in Firestore, a new user document
 * is created with default role and status.
 *
 * @param email - The user's email address.
 * @param password - The user's password.
 *
 * @returns A Result object containing the user's UID and role on success,
 *          or an error on failure.
 */
 async signInWithGoogle(): Promise<Result<{ userId: string; role: UserRole }>> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Parse name
      let firstName = "";
      let middleName: string | null = null;
      let lastName = "";
      if (firebaseUser.displayName) {
        const parts = firebaseUser.displayName.split(" ");
        firstName = parts[0];
        if (parts.length === 2) {
          lastName = parts[1];
        } else if (parts.length > 2) {
          middleName = parts.slice(1, -1).join(" ");
          lastName = parts[parts.length - 1];
        }
      }

      const uid = firebaseUser.uid;
      const userRef = doc(db, COLLECTION.USERS, uid);
      const existingDoc = await getDoc(userRef);

      if (!existingDoc.exists()) {
        await userService.createUser(uid, {
          id: uid,
          email: firebaseUser.email || "",
          firstName,
          middleName,
          lastName,
          role: USER_ROLE.USER,

          photoURL: firebaseUser.photoURL || null,
        });
      }

      const role = existingDoc.exists()
        ? (existingDoc.data().role as UserRole)
        : USER_ROLE.USER;

      return ok({ userId: uid, role });
    } catch (error: any) {
      logError("AuthService.signInWithGoogle", error);
      return fail(this.handleAuthError(error).message, error.code);
    }
  }

  /**
 * Signs out the currently authenticated Firebase user.
 *
 * @returns A Result object indicating success or containing an error if the sign-out fails.
 */
  async signOut(): Promise<Result<void>> {
    try {
      await firebaseSignOut(auth);

      return ok();
    } catch (error: any) {
      logError("AuthService.signOut", error);
      return fail(this.handleAuthError(error).message, error.code);
    }
  }

 
  async getToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.warn("⚠️ No user is logged in, cannot get token");
      return null;
    }

    try {
      const token = await user.getIdToken(true);
      return token;
    } catch (error) {
      console.error("❌ Failed to get Firebase ID token:", error);
      return null;
    }
  }

  /** Map Firebase auth errors to user-friendly messages */
  private handleAuthError(error: any): { message: string } {
    let message = "An error occurred during authentication.";

    switch (error.code) {
      case "auth/user-not-found":
        message = "No account found with this email address.";
        break;
      case "auth/wrong-password":
        message = "Incorrect password.";
        break;
      case "auth/email-already-in-use":
        message = "An account with this email already exists.";
        break;
      case "auth/weak-password":
        message = "Password should be at least 6 characters.";
        break;
      case "auth/invalid-email":
        message = "Invalid email address.";
        break;
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please try again later.";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your connection.";
        break;
      case "auth/popup-closed-by-user":
        message = "Sign-in popup was closed before completion.";
        break;
      default:
        message = error.message || message;
    }

    return { message };
  }

   /**
 * Registers a callback function that is triggered whenever the Firebase
 * Authentication state changes (e.g., user signs in or out).
 *
 * @param callback - Function to be called with the current FirebaseUser or null.
 * @returns An unsubscribe function to stop listening to auth state changes.
 */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }
  
}

export const authService = new AuthService();
