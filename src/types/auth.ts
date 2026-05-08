export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  country: string;
  city: string;
  address: string;
  birthdate: string;
}

export interface Auth {
  id: string;
  email: string;
  role: "student" | "coach";
  token: string;
}

export interface LoginCredentials {
  userName: string;
  password: string;
}
