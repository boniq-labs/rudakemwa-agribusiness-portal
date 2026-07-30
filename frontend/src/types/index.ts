export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleName: string;
  departmentId: number | null;
  departmentName: string | null;
  photo: string | null;
  phone: string | null;
  permissions: string[];
  departments?: { id: number; name: string }[];
}

export interface AppSettings {
  system_name: string;
  farm_name: string;
  farm_logo: string;
  favicon: string;
  farm_address: string;
  phone_number: string;
  email: string;
  system_info: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  assignedById: number;
  assignedToId: number;
  dueDate: string | null;
  status: string;
  createdAt: string;
}

export interface DashboardData {
  notifications: Notification[];
  tasks: Task[];
  [key: string]: any;
}

export interface ApiError {
  error: string;
}
