import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        orgId?: string | null;
        role: "ADMIN" | "TECH" | "CUSTOMER";
      };
    }
  }
}

export {};
