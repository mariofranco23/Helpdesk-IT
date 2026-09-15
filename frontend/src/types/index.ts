// Enums
export enum TicketStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  IN_PROCESS = 'IN_PROCESS',
  WAITING_CLIENT = 'WAITING_CLIENT',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  WAITING_THIRD_PARTY = 'WAITING_THIRD_PARTY',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum MessageType {
  PUBLIC_REPLY = 'PUBLIC_REPLY',
  INTERNAL_NOTE = 'INTERNAL_NOTE',
  TIME_ENTRY = 'TIME_ENTRY',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ASSIGNMENT = 'ASSIGNMENT',
  APPROVAL = 'APPROVAL',
}

export enum MessageChannel {
  WEB = 'WEB',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  PHONE = 'PHONE',
  INTERNAL = 'INTERNAL',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Role {
  EXTERNAL_REQUESTER = 'EXTERNAL_REQUESTER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  IT_AGENT = 'IT_AGENT',
  IT_SUPERVISOR = 'IT_SUPERVISOR',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

// Models
export interface User {
  user_id: string
  username: string
  email: string
  role: Role
  company_id: string
}

export interface AuthContext {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface Ticket {
  id: string
  public_id: string
  company_id: string
  requester_id: string
  assigned_to: string | null
  title: string
  description: string
  type: string
  priority: TicketPriority
  status: TicketStatus
  impact: string
  urgency: string
  category: string
  subcategory: string
  sector: string
  branch: string
  estimated_cost: number | null
  approved_cost: number | null
  first_response_due: string | null
  resolution_due: string | null
  created_at: string
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  updated_at: string
  tags: string[]
  custom_data: Record<string, any>
}

export interface Message {
  id: string
  ticket_id: string
  author_id: string
  type: MessageType
  channel: MessageChannel
  content: string
  is_internal: boolean
  is_system: boolean
  delivery_status: string
  delivery_attempts: number
  last_attempt_at: string | null
  created_at: string
  updated_at: string
}

export interface CostApproval {
  id: string
  ticket_id: string
  amount: number
  currency: string
  concept: string
  description: string
  status: ApprovalStatus
  requested_by: string
  requested_at: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  ticket_id: string
  agent_id: string
  duration_minutes: number
  work_type: string
  description: string
  work_date: string
  billing_status: string
  created_at: string
  updated_at: string
}
