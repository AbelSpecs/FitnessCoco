export interface Auth {
  id: string;
  email: string;
  role: "student" | "coach";
  token: string;
}
