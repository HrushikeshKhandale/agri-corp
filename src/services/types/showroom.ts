// src/services/types/showroom.ts

export interface Showroom {
  id: number;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  adminEmail: string | null;
  adminPassword: string | null;
}

// ✅ Payload for create/update — does NOT include 'id'
export type ShowroomPayload = Omit<Showroom, 'id'>;