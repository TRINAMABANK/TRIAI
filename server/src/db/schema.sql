-- =============================================================================
-- TRÍ AI SAAS PLATFORM — RELATIONAL DATABASE SCHEMA (16 CORE TABLES)
-- Production-Ready SQLite / PostgreSQL Compatible Schema
-- =============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '/assets/user_avatar.png',
    role TEXT NOT NULL DEFAULT 'customer', -- 'owner' | 'admin' | 'customer' | 'user'
    plan TEXT DEFAULT 'Gói Khách Hàng',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar_url TEXT DEFAULT '/assets/user_avatar.png',
    bio TEXT,
    greeting TEXT,
    specialties_json TEXT, -- JSON Array of specialty tags
    model_config_json TEXT, -- JSON Object with model parameters
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 3. SKILLS TABLE
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'blue',
    price_month TEXT DEFAULT '199.000đ',
    price_year TEXT DEFAULT '1.990.000đ',
    icon_name TEXT DEFAULT 'Sparkles',
    author TEXT DEFAULT 'TRÍ AI Master',
    status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'archived'
    current_version TEXT NOT NULL DEFAULT '1.0.0',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 4. SKILL VERSIONS TABLE
CREATE TABLE IF NOT EXISTS skill_versions (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL,
    version TEXT NOT NULL, -- e.g. '1.0.0', '1.1.0'
    changelog TEXT,
    system_role TEXT,
    sample_prompt TEXT,
    skill_md TEXT,
    checklist_json TEXT, -- JSON Array of checklist items
    sample_files_json TEXT, -- JSON Array of sample files
    prompts_json TEXT, -- JSON Object of prompt templates
    knowledge_json TEXT, -- JSON Array of domain knowledge
    tools_json TEXT, -- JSON Array of tool requirements
    parameters_schema_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(skill_id, version)
);

-- 5. AGENT_SKILLS JUNCTION TABLE (Many-to-Many Binding)
CREATE TABLE IF NOT EXISTS agent_skills (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(agent_id, skill_id)
);

-- 6. LICENSES TABLE
CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT,
    skill_id TEXT NOT NULL,
    skill_version TEXT DEFAULT '1.0.0',
    license_key TEXT,
    license_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly' | 'permanent' | 'purchased'
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'revoked'
    price_paid TEXT,
    granted_by TEXT, -- email or system
    starts_at TEXT,
    expires_at TEXT, -- NULL for lifetime, or ISO timestamp
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 7. TRIALS TABLE
CREATE TABLE IF NOT EXISTS trials (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired'
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(user_id, skill_id)
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    order_code TEXT UNIQUE NOT NULL,
    total_amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'VND',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'cancelled'
    payment_method TEXT NOT NULL DEFAULT 'vietqr',
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    skill_name TEXT,
    skill_version TEXT NOT NULL DEFAULT '1.0.0',
    plan_duration TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly'
    unit_price INTEGER NOT NULL DEFAULT 0,
    total_price INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 10. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    user_id TEXT,
    transaction_ref TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'VND',
    payment_gateway TEXT DEFAULT 'vietqr',
    bank_name TEXT DEFAULT 'Ngân hàng TMCP Phương Đông (OCB)',
    account_number TEXT DEFAULT '0004100030588008',
    account_name TEXT DEFAULT 'QUANG NHỰT TRÍ',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'success' | 'failed'
    raw_response_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 11. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    agent_id TEXT,
    skill_id TEXT,
    title TEXT NOT NULL DEFAULT 'Cuộc hội thoại mới',
    is_archived INTEGER NOT NULL DEFAULT 0,
    last_message_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_type TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
    sender_id TEXT,
    content TEXT NOT NULL,
    metadata_json TEXT, -- JSON Object with attachments, skillId, metrics
    created_at TEXT NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 13. FILES TABLE
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    conversation_id TEXT,
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    purpose TEXT DEFAULT 'attachment', -- 'attachment' | 'knowledge' | 'generated'
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. KNOWLEDGE SOURCES TABLE
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'document', -- 'document' | 'law' | 'standard' | 'faq'
    skill_id TEXT,
    agent_id TEXT,
    content TEXT NOT NULL,
    metadata_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- 15. TOOLS TABLE
CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parameters_schema_json TEXT,
    handler_type TEXT NOT NULL DEFAULT 'internal', -- 'internal' | 'api' | 'script'
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- 16. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details_json TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL
);

-- 17. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL DEFAULT 'payment_pending',
    order_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data_json TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    read_at TEXT,
    created_at TEXT NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_licenses_user_skill ON licenses(user_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_trials_user_skill ON trials(user_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);
