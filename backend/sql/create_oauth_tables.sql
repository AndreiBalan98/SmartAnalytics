-- ==================================================
-- SCRIPTUL SQL PENTRU TABELELE DE AUTENTIFICARE OAUTH
-- ==================================================
-- Execută acest script în pgAdmin conectat la baza de date
-- ==================================================

-- 1. Tabel pentru salvarea state-urilor OAuth (verificare la callback)
-- ==================================================
CREATE TABLE IF NOT EXISTS oauth_states (
    id SERIAL PRIMARY KEY,
    state VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- 'meta', 'google_ads', 'ga4'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_oauth_states_state ON oauth_states(state);
CREATE INDEX idx_oauth_states_user ON oauth_states(user_id);
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);

-- ==================================================
-- 2. Tabel meta_tokens - Token-uri pentru Meta Ads
-- ==================================================
CREATE TABLE IF NOT EXISTS meta_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, -- Un user are doar o conexiune Meta activă
    token TEXT NOT NULL,
    scopes JSONB NOT NULL, -- ['ads_read', 'business_management', 'leads_retrieval']
    expiry_date TIMESTAMP NOT NULL,
    meta_user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_meta_tokens_user ON meta_tokens(user_id);
CREATE INDEX idx_meta_tokens_meta_user ON meta_tokens(meta_user_id);
CREATE INDEX idx_meta_tokens_expiry ON meta_tokens(expiry_date);

-- ==================================================
-- 3. Tabel google_tokens - Token-uri pentru Google Ads
-- ==================================================
CREATE TABLE IF NOT EXISTS google_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, -- Un user are doar o conexiune Google Ads activă
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    scopes JSONB NOT NULL, -- ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/adwords']
    expiry_date TIMESTAMP NOT NULL,
    user_openid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_google_tokens_user ON google_tokens(user_id);
CREATE INDEX idx_google_tokens_openid ON google_tokens(user_openid);
CREATE INDEX idx_google_tokens_expiry ON google_tokens(expiry_date);

-- ==================================================
-- 4. Tabel ga4_tokens - Token-uri pentru Google Analytics 4
-- ==================================================
CREATE TABLE IF NOT EXISTS ga4_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, -- Un user are doar o conexiune GA4 activă
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    scopes JSONB NOT NULL, -- ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/analytics.readonly']
    expiry_date TIMESTAMP NOT NULL,
    user_openid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_ga4_tokens_user ON ga4_tokens(user_id);
CREATE INDEX idx_ga4_tokens_openid ON ga4_tokens(user_openid);
CREATE INDEX idx_ga4_tokens_expiry ON ga4_tokens(expiry_date);

-- ==================================================
-- Trigger pentru auto-update al updated_at
-- ==================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meta_tokens_updated_at
    BEFORE UPDATE ON meta_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_tokens_updated_at
    BEFORE UPDATE ON google_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ga4_tokens_updated_at
    BEFORE UPDATE ON ga4_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- Cleanup trigger pentru state-uri expirate (opțional)
-- ==================================================
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Rulează cleanup manual:
-- SELECT cleanup_expired_oauth_states();

-- ==================================================
-- DONE! Tabelele au fost create cu succes
-- ==================================================
