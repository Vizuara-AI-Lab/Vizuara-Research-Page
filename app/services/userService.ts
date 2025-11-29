import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    WhereFilterOp,
    serverTimestamp,
    Query,
    orderBy,
    endBefore,
    limitToLast,
    limit,
    startAfter,
} from "firebase/firestore";


import { UserRole } from "@/app/types/general";
import { auth,db } from "../lib/firebaseClient";
import { User } from "../types/user";
import { fail, ok, Result } from "@/app/utils/response";
import { logError } from "@/app/utils/logger";
import { COLLECTION } from "../types/constants";


class UserService {
  /**
   * Creates a new user in Firestore.
   */
  async createUser(
    uid: string,
    data: Omit<User, "createdAt" | "updatedAt">
  ): Promise<Result<void>> {
    try {
      const user: User = {
        id: uid,
        username: data.username || "",
        email: data.email,
        firstName: data.firstName,
        middleName: data.middleName || "",
        lastName: data.lastName,
        role: data.role,

        photoURL: data.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, COLLECTION.USERS, uid), user);
      console.log("UserService - User created successfully:", uid);
      return ok();
    } catch (error) {
      logError("UserService.createUser", error);
      return fail("Failed to create user");
    }
  }

  /**
   * Updates an existing user document.
   */
  async updateUser(uid: string, updates: Partial<User>): Promise<Result<void>> {
    try {
      const userRef = doc(db, COLLECTION.USERS, uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return fail("User not found", "NOT_FOUND");
      }

      const updateData: Partial<User> = {
        updatedAt: serverTimestamp(),
        ...updates,
      };

      await updateDoc(userRef, updateData);
      console.log("UserService - User updated successfully:", uid);
      return ok();
    } catch (error) {
      logError("UserService.updateUser", error);
      return fail("Failed to update user");
    }
  }

  /**
   * Retrieves user by username
   */
  async getUserByUsername(username: string): Promise<Result<User | null>> {
    try {
      const usersRef = collection(db, COLLECTION.USERS);
      const q = query(usersRef, where("username", "==", username));
      // Execute query
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return ok(null);
      }

      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();

      const user: User = {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as User;

      return ok(user);
    } catch (error) {
      logError("UserService.getUserByUsername", error);
      return fail("Failed to fetch user by username");
    }
  }

  /**
   * Retrieves a single user by ID.
   */
  async getUserById(uid: string): Promise<Result<User | null>> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTION.USERS, uid));

      if (!userDoc.exists()) {
        return ok(null);
      }

      const data = userDoc.data();
      const user: User = {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as User;

      return ok(user);
    } catch (error) {
      logError("UserService.getUserById", error);
      return fail("Failed to fetch user by ID");
    }
  }

 


  /**
   * Deletes a user by ID.
   */
  async deleteUser(uid: string): Promise<Result<void>> {
    try {
      await deleteDoc(doc(db, COLLECTION.USERS, uid));
      console.log("UserService - User deleted successfully:", uid);
      return ok();
    } catch (error) {
      logError("UserService.deleteUser", error);
      return fail("Failed to delete user");
    }
  }

  /**
   * Updates only the user"s role.
   */
  async changeUserRole(uid: string, newRole: UserRole): Promise<Result<void>> {
    try {
      const userRef = doc(db, COLLECTION.USERS, uid);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      return ok();
    } catch (error) {
      logError("UserService.changeUserRole", error);
      return fail("Failed to change user role");
    }
  }
  /**
   * Retrieves user by email
   */
  async getUserByEmail(email: string): Promise<Result<User | null>> {
    try {
      const usersRef = collection(db, COLLECTION.USERS);
      const q = query(usersRef, where("email", "==", email));
      // Execute query
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return ok(null);
      }

      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();

      const user: User = {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as User;

      return ok(user);
    } catch (error) {
      logError("UserService.getUserByEmail", error);
      return fail("Failed to fetch user by email");
    }
  }

  


  


}

export const userService = new UserService();
