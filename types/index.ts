// FILE: types/index.ts

// Import types from Prisma Client (these are generated after running `npx prisma generate`)
export type {
  Role,
  RegistrationSource,
  DistributionStatus,
  ParticipantType,
} from "@prisma/client";

// Re-export for convenience
import type {
  Role,
  RegistrationSource,
  DistributionStatus,
  ParticipantType,
} from "@prisma/client";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type Event = {
  id: string;
  facilitator: string;
  date: Date;
  preRegLink: string;
  isPreRegOpen: boolean;
  defaultMlkbankoAmount: number;
  defaultRegistrationFee: number;
  totalCryptoReceived: number;
  useRemainingBalance: boolean;
  createdAt: Date;
  createdById: string;
};

export type Participant = {
  id: string;
  fullname: string;
  email?: string | null;
  phoneNumber?: string | null;
  homeAddress?: string | null;
  birthday?: Date | null;
  participantType: ParticipantType;
  yoroiAddress: string;
  qrCodeUrl?: string | null;
  mlkbankoAmount: number;
  registrationFee: number;
  paymentProofUrl?: string | null;
  registrationSource: RegistrationSource;
  distributionStatus: DistributionStatus;
  eventId: string;
  createdById?: string | null;
  createdAt: Date;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  receiptUrl?: string | null;
  eventId: string;
  addedById: string;
  createdAt: Date;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: Role;
};
