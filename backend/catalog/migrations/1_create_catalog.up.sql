CREATE TABLE IF NOT EXISTS api_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('rest', 'mcp', 'graphql')),
    base_url TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'apikey', 'bearer', 'oauth')),
    api_key TEXT,
    headers TEXT DEFAULT '{}',
    widget_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_active ON api_services(is_active, created_at DESC);
