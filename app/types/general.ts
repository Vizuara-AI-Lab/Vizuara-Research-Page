import { USER_ROLE } from "./constants";



export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];