import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("service_catalog", {
  migrations: "./migrations",
});

export interface APIService {
  id: string;
  name: string;
  description: string;
  type: "rest" | "mcp" | "graphql";
  baseUrl: string;
  authType: "none" | "apikey" | "bearer" | "oauth";
  apiKey?: string;
  headers?: Record<string, string>;
  widgetType?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  serverUrl: string;
  protocol: string;
  capabilities: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface AddServiceRequest {
  name: string;
  description: string;
  type: "rest" | "mcp" | "graphql";
  baseUrl: string;
  authType: "none" | "apikey" | "bearer" | "oauth";
  apiKey?: string;
  headers?: Record<string, string>;
  widgetType?: string;
}

export interface ServiceListResponse {
  services: APIService[];
}

export const addService = api(
  { expose: true, method: "POST", path: "/catalog/services" },
  async (req: AddServiceRequest): Promise<APIService> => {
    const id = `svc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.exec`
      INSERT INTO api_services (id, name, description, type, base_url, auth_type, api_key, headers, widget_type, is_active, created_at)
      VALUES (${id}, ${req.name}, ${req.description}, ${req.type}, ${req.baseUrl}, ${req.authType}, ${req.apiKey}, ${JSON.stringify(req.headers || {})}, ${req.widgetType}, true, NOW())
    `;
    
    const rows: APIService[] = [];
    for await (const row of db.query<any>`
      SELECT * FROM api_services WHERE id = ${id}
    `) {
      rows.push({
        ...row,
        headers: JSON.parse(row.headers || "{}"),
        createdAt: new Date(row.created_at),
      });
    }
    
    return rows[0];
  }
);

export const listServices = api(
  { expose: true, method: "GET", path: "/catalog/services" },
  async (): Promise<ServiceListResponse> => {
    const services: APIService[] = [];
    
    for await (const row of db.query<any>`
      SELECT * FROM api_services WHERE is_active = true ORDER BY created_at DESC
    `) {
      services.push({
        ...row,
        headers: JSON.parse(row.headers || "{}"),
        createdAt: new Date(row.created_at),
      });
    }
    
    return { services };
  }
);

export interface APICallResponse {
  data: any;
  status: number;
}

export const callExternalAPI = api(
  { expose: true, method: "POST", path: "/catalog/services/:serviceId/call" },
  async (req: { serviceId: string; endpoint: string; method?: string; body?: any }): Promise<APICallResponse> => {
    const rows: any[] = [];
    for await (const row of db.query<any>`
      SELECT * FROM api_services WHERE id = ${req.serviceId}
    `) {
      rows.push({
        ...row,
        headers: JSON.parse(row.headers || "{}"),
      });
    }
    
    const service = rows[0];
    if (!service) {
      throw new Error(`Service not found: ${req.serviceId}`);
    }
    
    const url = `${service.base_url}${req.endpoint}`;
    const headers: Record<string, string> = { ...service.headers };
    
    if (service.auth_type === "apikey" && service.api_key) {
      headers["X-API-Key"] = service.api_key;
    } else if (service.auth_type === "bearer" && service.api_key) {
      headers["Authorization"] = `Bearer ${service.api_key}`;
    }
    
    const response = await fetch(url, {
      method: req.method || "GET",
      headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      data,
      status: response.status,
    };
  }
);

export const deleteService = api(
  { expose: true, method: "DELETE", path: "/catalog/services/:serviceId" },
  async (req: { serviceId: string }): Promise<void> => {
    await db.exec`UPDATE api_services SET is_active = false WHERE id = ${req.serviceId}`;
  }
);
