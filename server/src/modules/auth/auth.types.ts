import type { Role } from '@prisma/client';

export type PublicRole = Exclude<Role, 'ADMIN'>;

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  // Farmer Profile fields
  village?: string;
  district?: string;
  state?: string;
  producerType?: string;
  category?: string;
  farmName?: string;
  // Buyer Profile fields
  businessName?: string;
  contactPerson?: string;
  businessType?: string;
  location?: string;
  gstin?: string;
  // Transporter Profile fields
  fullName?: string;
  vehicleType?: string;
  vehicleRegNo?: string;
  capacity?: string;
  operatingRegion?: string;
  ownership?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub?: string;
  userId: string;
  role: Role;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  createdAt: Date;
  profileId?: string | null;
}

export interface AuthResponseData {
  user: AuthUser;
  token: string;
}
