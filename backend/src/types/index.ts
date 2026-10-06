export interface AuthUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  adminRole?: 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT' | 'ORDER_MANAGER' | 'INVENTORY_MANAGER' | 'MARKETING_MANAGER';
  sid?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
