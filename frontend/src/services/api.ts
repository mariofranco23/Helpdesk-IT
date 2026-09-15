import {
  Ticket,
  Message,
  TimeEntry,
  CostApproval,
  User,
  TicketStatus,
} from '../types'

const API_BASE_URL = '/api'

interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private getHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Error desconocido',
      }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Tickets
  async getTickets(filters?: {
    status?: TicketStatus
    priority?: string
    search?: string
    assigned_to?: string
  }): Promise<Ticket[]> {
    let endpoint = '/tickets'
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to)

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    return this.request<Ticket[]>('GET', endpoint)
  }

  async getTicket(id: string): Promise<Ticket> {
    return this.request<Ticket>('GET', `/tickets/${id}`)
  }

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    return this.request<Ticket>('POST', '/tickets', data)
  }

  async updateTicket(
    id: string,
    data: Partial<Ticket>
  ): Promise<Ticket> {
    return this.request<Ticket>('PATCH', `/tickets/${id}`, data)
  }

  // Messages
  async getMessages(ticketId: string): Promise<Message[]> {
    return this.request<Message[]>('GET', `/tickets/${ticketId}/messages`)
  }

  async addMessage(
    ticketId: string,
    data: Partial<Message>
  ): Promise<Message> {
    return this.request<Message>(
      'POST',
      `/tickets/${ticketId}/messages`,
      data
    )
  }

  // Time Entries
  async getTimeEntries(): Promise<TimeEntry[]> {
    return this.request<TimeEntry[]>('GET', '/time-entries')
  }

  async createTimeEntry(data: Partial<TimeEntry>): Promise<TimeEntry> {
    return this.request<TimeEntry>('POST', '/time-entries', data)
  }

  async updateTimeEntry(
    id: string,
    data: Partial<TimeEntry>
  ): Promise<TimeEntry> {
    return this.request<TimeEntry>('PATCH', `/time-entries/${id}`, data)
  }

  async deleteTimeEntry(id: string): Promise<void> {
    return this.request<void>('DELETE', `/time-entries/${id}`)
  }

  // Cost Approvals
  async getApprovals(status?: string): Promise<CostApproval[]> {
    let endpoint = '/approvals'
    if (status) {
      endpoint += `?status=${status}`
    }
    return this.request<CostApproval[]>('GET', endpoint)
  }

  async updateApproval(
    id: string,
    data: Partial<CostApproval>
  ): Promise<CostApproval> {
    return this.request<CostApproval>('PATCH', `/approvals/${id}`, data)
  }

  // Dashboard
  async getDashboardStats(): Promise<any> {
    return this.request<any>('GET', '/dashboard/stats')
  }

  // Auth
  async login(email: string, password: string): Promise<{
    access_token: string
    user: User
  }> {
    return this.request('POST', '/auth/login', { email, password })
  }
}

export const apiClient = new ApiClient()
