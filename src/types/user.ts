import { Goal } from "./goals";

export interface User {
  id?: number;
  name?: string;
  age?: number;
  weight?: number;
  gender?: string;
  goal?: Goal;
  coachId?: number;
  streak?: number;
  planType?: "basic" | "health" | "pro";
  parqCompleted?: boolean;
  parqValidUntil?: string;
}
