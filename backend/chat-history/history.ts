import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("chat_history", {
  migrations: "./migrations",
});

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SessionListResponse {
  sessions: ChatSession[];
}

export interface MessageListResponse {
  messages: ChatMessage[];
}

export const createSession = api(
  { expose: true, method: "POST", path: "/chat-history/sessions" },
  async (req: { title: string }): Promise<ChatSession> => {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.exec`
      INSERT INTO chat_sessions (id, title, created_at, updated_at)
      VALUES (${id}, ${req.title}, NOW(), NOW())
    `;
    
    const rows: ChatSession[] = [];
    for await (const row of db.query<ChatSession>`
      SELECT id, title, created_at as "createdAt", updated_at as "updatedAt"
      FROM chat_sessions WHERE id = ${id}
    `) {
      rows.push(row);
    }
    
    return rows[0];
  }
);

export const listSessions = api(
  { expose: true, method: "GET", path: "/chat-history/sessions" },
  async (): Promise<SessionListResponse> => {
    const sessions: ChatSession[] = [];
    for await (const row of db.query<ChatSession>`
      SELECT id, title, created_at as "createdAt", updated_at as "updatedAt"
      FROM chat_sessions
      ORDER BY updated_at DESC
      LIMIT 50
    `) {
      sessions.push(row);
    }
    
    return { sessions };
  }
);

export const addMessage = api(
  { expose: true, method: "POST", path: "/chat-history/sessions/:sessionId/messages" },
  async (req: { sessionId: string; role: "user" | "assistant"; content: string }): Promise<ChatMessage> => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.exec`
      INSERT INTO chat_messages (id, session_id, role, content, timestamp)
      VALUES (${id}, ${req.sessionId}, ${req.role}, ${req.content}, NOW())
    `;
    
    await db.exec`
      UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${req.sessionId}
    `;
    
    const rows: ChatMessage[] = [];
    for await (const row of db.query<ChatMessage>`
      SELECT id, session_id as "sessionId", role, content, timestamp
      FROM chat_messages WHERE id = ${id}
    `) {
      rows.push(row);
    }
    
    return rows[0];
  }
);

export const getMessages = api(
  { expose: true, method: "GET", path: "/chat-history/sessions/:sessionId/messages" },
  async (req: { sessionId: string }): Promise<MessageListResponse> => {
    const messages: ChatMessage[] = [];
    for await (const row of db.query<ChatMessage>`
      SELECT id, session_id as "sessionId", role, content, timestamp
      FROM chat_messages
      WHERE session_id = ${req.sessionId}
      ORDER BY timestamp ASC
    `) {
      messages.push(row);
    }
    
    return { messages };
  }
);

export const deleteSession = api(
  { expose: true, method: "DELETE", path: "/chat-history/sessions/:sessionId" },
  async (req: { sessionId: string }): Promise<void> => {
    await db.exec`DELETE FROM chat_messages WHERE session_id = ${req.sessionId}`;
    await db.exec`DELETE FROM chat_sessions WHERE id = ${req.sessionId}`;
  }
);
