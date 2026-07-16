-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WEBSITES TABLE
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    risk_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'unscanned', -- 'safe', 'defaced', 'vulnerable', 'unscanned'
    baseline_html TEXT,
    baseline_title TEXT,
    baseline_headers JSONB,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_url ON public.websites(url);

-- 2. SCAN HISTORY TABLE (Renamed from scans to scan_history)
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- in milliseconds
    title TEXT,
    html TEXT,
    html_changed BOOLEAN DEFAULT false,
    title_changed BOOLEAN DEFAULT false,
    missing_elements JSONB DEFAULT '[]'::jsonb,
    suspicious_text_detected BOOLEAN DEFAULT false,
    suspicious_text_details TEXT,
    risk_score INTEGER DEFAULT 0,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'low', 'medium', 'high', 'critical'
    security_headers JSONB DEFAULT '{}'::jsonb, -- HTTP header analysis
    ai_explanation TEXT,
    ai_recommendations JSONB DEFAULT '[]'::jsonb,
    ai_confidence INTEGER DEFAULT 100 -- Added confidence field
);

CREATE INDEX IF NOT EXISTS idx_scan_history_website_id ON public.scan_history(website_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history(user_id);

-- 3. ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scan_id UUID REFERENCES public.scan_history(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'defacement', 'high_risk', 'security_headers', 'missing_https'
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info', -- Added severity column ('info', 'low', 'medium', 'high', 'critical')
    resolved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_website_id ON public.alerts(website_id);

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    website_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- 'USER_REGISTER', 'USER_LOGIN', 'USER_LOGOUT', 'WEBSITE_ADD', 'WEBSITE_EDIT', 'WEBSITE_DELETE', 'SCAN_RUN', 'AI_ANALYSIS', 'ALERT_GENERATED'
    details TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Website RLS
CREATE POLICY "Users can manage their own websites" 
    ON public.websites 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Scan History RLS
CREATE POLICY "Users can manage their own scan history" 
    ON public.scan_history 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Alert RLS
CREATE POLICY "Users can manage their own alerts" 
    ON public.alerts 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Audit Log RLS
CREATE POLICY "Users can view their own audit logs" 
    ON public.audit_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System/Backend can insert audit logs" 
    ON public.audit_logs 
    FOR INSERT 
    WITH CHECK (true);
