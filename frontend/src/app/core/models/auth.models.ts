export type UserRole = 'COORDINADOR' | 'ASESOR' | 'ESTUDIANTE';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
  };
}

export interface ApiErrorResponse {
  non_field_errors?: string[];
  email?: string[];
  password?: string[];
  [key: string]: string[] | undefined;
}
