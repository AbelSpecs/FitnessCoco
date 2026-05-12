import { User } from "./user";

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  country: number;
  city: number;
  address: string;
  birthdate: string;
}

export interface Auth {
  user?: UserAuth | null;
  token?: string | null;
  // isLoading: boolean;
  setAuth: (user: UserAuth, token: string) => void;
  updateUser?: (userData: Partial<User>) => void;
  logout: () => void;
  // setLoading: (status: boolean) => void;
}

export interface LoginCredentials {
  userName: string;
  password: string;
}

export interface UserAuth {
  id?: string;
  email?: string;
  firstName?: string;
  role?: "student" | "coach";
}
