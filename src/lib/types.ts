export type Gender = "male" | "female";
export type AgentStatus = "active" | "leave" | "off";

export interface Agent {
  id: string; // J&T agent ID (also the Firestore doc id)
  name: string;
  gender: Gender;
  status: AgentStatus;
  /** Who covers ALL of this agent's accounts while they're away (fallback when a client has no own support agent). */
  coverAgentId: string | null;
  phone?: string;
  email?: string;
  area?: string;
  /** Avatar style tweak: female agents can be drawn with or without hijab. */
  hijab?: boolean;
  /** True when the ID was missing in the sheet and a temporary one was generated. */
  tempId?: boolean;
  updatedAt?: number;
}

export interface Branch {
  id: string; // slug of the branch name
  name: string;
  area: string;
  avgShipmentsPerDay: number;
  totalCustomers: number;
  agentIds: string[];
  updatedAt?: number;
}

export interface Client {
  id: string; // client code
  name: string;
  code: string;
  branchId: string | null;
  agentId: string | null;
  supportAgentId: string | null;
  notes?: string;
  updatedAt?: number;
}

export interface Dataset {
  clients: Client[];
  agents: Agent[];
  branches: Branch[];
}

export type Collection = keyof Dataset;
