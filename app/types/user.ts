import {  UserRole,  } from "@/app/types/general";
import { FieldValue, Timestamp } from "firebase/firestore";

export interface User {
    id: string;
    username?: string;
    email: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    role: UserRole;
    photoURL?: string | null;
    createdAt: Timestamp | FieldValue;
    updatedAt: Timestamp | FieldValue;
};
