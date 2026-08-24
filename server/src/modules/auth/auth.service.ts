import { Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import type { RegisterDto, LoginDto, JwtPayload, AuthUser } from './auth.types.js';

// Default session expiration: 7 days in milliseconds
const SESSION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export class AppAuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AppAuthError';
    this.statusCode = statusCode;
  }
}

export class AuthService {
  /**
   * Generates a signed JWT token containing user identification and session ID
   */
  public generateJwtToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Verifies and decodes a JWT token
   */
  public verifyJwtToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
      const errorName = error instanceof Error ? error.name : '';
      if (errorName === 'TokenExpiredError' || error instanceof jwt.TokenExpiredError) {
        throw new AppAuthError('Your session has expired. Please log in again.', 401);
      }
      if (errorName === 'JsonWebTokenError' || error instanceof jwt.JsonWebTokenError) {
        throw new AppAuthError('Invalid authentication token. Please log in again.', 401);
      }
      throw new AppAuthError('Authentication failed. Please log in again.', 401);
    }
  }

  /**
   * Formats a User record into a safe, client-facing AuthUser (omitting passwordHash)
   */
  public toSafeUser(user: User, profileId?: string | null): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      profileId: profileId ?? null,
    };
  }

  /**
   * Registers a new user with bcrypt password hashing, 1:1 role profile, and an active Session
   */
  public async registerUser(data: RegisterDto): Promise<{ user: AuthUser; token: string }> {
    // 1. Check for existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new AppAuthError('An account with this email address already exists.', 409);
    }

    // 2. Check for existing phone if provided
    if (data.phone && data.phone.trim()) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone.trim() },
      });
      if (existingPhone) {
        throw new AppAuthError('An account with this phone number already exists.', 409);
      }
    }

    // 3. Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // 4. Create User, Role-Specific Profile, and Session in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: data.role,
          phone: data.phone?.trim() || null,
        },
      });

      let profileId: string | null = null;

      if (data.role === Role.FARMER) {
        const profile = await tx.farmerProfile.create({
          data: {
            userId: user.id,
            phone: data.phone?.trim() || null,
            village: data.village || null,
            district: data.district || null,
            state: data.state || 'Maharashtra',
            producerType: data.producerType || 'Farmer',
            category: data.category || 'Fresh Vegetables & Fruits',
            farmName: data.farmName || null,
          },
        });
        profileId = profile.id;
      } else if (data.role === Role.BUYER) {
        const profile = await tx.buyerProfile.create({
          data: {
            userId: user.id,
            businessName: data.businessName || data.name,
            contactPerson: data.contactPerson || data.name,
            businessType: data.businessType || 'APMC Licensed Commission Agent & Trader',
            location: data.location || 'Navi Mumbai APMC Mandi',
            gstin: data.gstin || null,
            phone: data.phone?.trim() || null,
          },
        });
        profileId = profile.id;
      } else if (data.role === Role.TRANSPORTER) {
        const profile = await tx.transporterProfile.create({
          data: {
            userId: user.id,
            fullName: data.fullName || data.name,
            vehicleType: data.vehicleType || 'Pickup (1.5 - 2.5 MT)',
            vehicleRegNo: data.vehicleRegNo || null,
            capacity: data.capacity || '2.0 MT',
            operatingRegion: data.operatingRegion || 'Western Maharashtra (Pune - Satara - Kolhapur)',
            ownership: data.ownership || 'Driver & Owner',
            phone: data.phone?.trim() || null,
          },
        });
        profileId = profile.id;
      }

      // Create an authenticated Session row
      const session = await tx.session.create({
        data: {
          userId: user.id,
          expiresAt: new Date(Date.now() + SESSION_EXPIRATION_MS),
        },
      });

      return { user, profileId, sessionId: session.id };
    });

    // 5. Generate JWT token embedding sessionId
    const token = this.generateJwtToken({
      sub: result.user.id,
      userId: result.user.id,
      role: result.user.role,
      sessionId: result.sessionId,
    });

    return {
      user: this.toSafeUser(result.user, result.profileId),
      token,
    };
  }

  /**
   * Authenticates user credentials, creates a new Session, and returns user and token
   */
  public async loginUser(data: LoginDto): Promise<{ user: AuthUser; token: string }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppAuthError('Invalid email or password.', 401);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppAuthError('Invalid email or password.', 401);
    }

    let profileId: string | null = null;
    if (user.role === Role.FARMER && user.farmerProfile) {
      profileId = user.farmerProfile.id;
    } else if (user.role === Role.BUYER && user.buyerProfile) {
      profileId = user.buyerProfile.id;
    } else if (user.role === Role.TRANSPORTER && user.transporterProfile) {
      profileId = user.transporterProfile.id;
    }

    // Create a new persistent Session row in PostgreSQL
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_EXPIRATION_MS),
      },
    });

    const token = this.generateJwtToken({
      sub: user.id,
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      user: this.toSafeUser(user, profileId),
      token,
    };
  }

  /**
   * Revokes an active Session by ID (Server-Side Logout)
   */
  public async logoutUser(sessionId: string): Promise<void> {
    await prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Retrieves current active user by ID
   */
  public async getCurrentUser(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        buyerProfile: true,
        transporterProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    let profileId: string | null = null;
    if (user.role === Role.FARMER && user.farmerProfile) {
      profileId = user.farmerProfile.id;
    } else if (user.role === Role.BUYER && user.buyerProfile) {
      profileId = user.buyerProfile.id;
    } else if (user.role === Role.TRANSPORTER && user.transporterProfile) {
      profileId = user.transporterProfile.id;
    }

    return this.toSafeUser(user, profileId);
  }
}

export const authService = new AuthService();
export const generateJwtToken = (payload: JwtPayload) => authService.generateJwtToken(payload);
export const verifyJwtToken = (token: string) => authService.verifyJwtToken(token);
export const registerUser = (data: RegisterDto) => authService.registerUser(data);
export const loginUser = (data: LoginDto) => authService.loginUser(data);
export const logoutUser = (sessionId: string) => authService.logoutUser(sessionId);
export const getCurrentUser = (userId: string) => authService.getCurrentUser(userId);
export const toSafeUser = (user: User, profileId?: string | null) => authService.toSafeUser(user, profileId);
