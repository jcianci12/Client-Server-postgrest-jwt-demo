-- Create extension for JWT handling
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create schema for API
CREATE SCHEMA api;

-- Create roles
CREATE ROLE authenticator WITH LOGIN PASSWORD 'mysecretpassword';
CREATE ROLE anon;
CREATE ROLE authenticated;

-- Set up role permissions
GRANT authenticated TO authenticator;
GRANT anon TO authenticator;
GRANT USAGE ON SCHEMA api TO authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA api TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO authenticator;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA api TO authenticator;

-- Create basic_auth schema for user management
CREATE SCHEMA basic_auth;

-- Create users table in basic_auth schema
CREATE TABLE basic_auth.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check if role exists
CREATE OR REPLACE FUNCTION basic_auth.check_role_exists()
RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = NEW.role) THEN
        RAISE foreign_key_violation USING message =
            'unknown database role: ' || NEW.role;
        RETURN NULL;
    END IF;
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Trigger to ensure role exists
CREATE CONSTRAINT TRIGGER ensure_user_role_exists
    AFTER INSERT OR UPDATE ON basic_auth.users
    FOR EACH ROW
    EXECUTE FUNCTION basic_auth.check_role_exists();

-- Create test table
CREATE TABLE api.test (
    id SERIAL PRIMARY KEY,
    data TEXT,
    user_id TEXT
);

-- Enable RLS
ALTER TABLE api.test ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own data"
    ON api.test FOR SELECT
    USING (current_user = user_id);

CREATE POLICY "Users can only insert their own data"
    ON api.test FOR INSERT
    WITH CHECK (current_user = user_id);

CREATE POLICY "Users can only update their own data"
    ON api.test FOR UPDATE
    USING (current_user = user_id)
    WITH CHECK (current_user = user_id);

CREATE POLICY "Users can only delete their own data"
    ON api.test FOR DELETE
    USING (current_user = user_id);

-- Function to create user role
CREATE OR REPLACE FUNCTION api.create_user_role(user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api, basic_auth
AS $$
DECLARE
    role_exists BOOLEAN;
BEGIN
    -- Check if role exists first
    SELECT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = user_id
    ) INTO role_exists;

    -- Log the attempt
    RAISE NOTICE 'Attempting to create role for user: %', user_id;
    RAISE NOTICE 'Role exists: %', role_exists;

    IF NOT role_exists THEN
        -- Create the role if it doesn't exist
        BEGIN
            EXECUTE format('CREATE ROLE %I NOLOGIN', user_id);
            RAISE NOTICE 'Successfully created role: %', user_id;
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Role already exists despite check: %', user_id;
        END;
    END IF;
    
    -- Grant the role to authenticator
    BEGIN
        EXECUTE format('GRANT %I TO authenticator', user_id);
        RAISE NOTICE 'Successfully granted role to authenticator';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to grant role to authenticator: %', SQLERRM;
    END;
    
    -- Grant necessary permissions to the role
    BEGIN
        EXECUTE format('GRANT USAGE ON SCHEMA api TO %I', user_id);
        EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA api TO %I', user_id);
        EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO %I', user_id);
        RAISE NOTICE 'Successfully granted permissions to role';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to grant permissions: %', SQLERRM;
    END;
    
    -- Insert or update user in basic_auth.users
    BEGIN
        INSERT INTO basic_auth.users (id, email, role)
        VALUES (user_id, user_id || '@example.com', user_id)
        ON CONFLICT (id) DO UPDATE
        SET role = EXCLUDED.role;
        RAISE NOTICE 'Successfully updated basic_auth.users';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update basic_auth.users: %', SQLERRM;
    END;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA api TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA api TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO authenticated;

-- Set search path
ALTER ROLE authenticator SET search_path TO api, public;

-- Set JWT configuration parameters
ALTER DATABASE postgres SET app.jwt_secret TO 'reallyreallyreallyreallyverysafesecret';
ALTER DATABASE postgres SET app.jwt_aud TO 'localparts';

-- JWT settings function
CREATE OR REPLACE FUNCTION api.get_jwt_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api
AS $$
DECLARE
    jwt_secret text;
    jwt_aud text;
BEGIN
    -- Get values from environment variables
    jwt_secret := current_setting('app.jwt_secret', true);
    jwt_aud := current_setting('app.jwt_aud', true);

    RETURN jsonb_build_object(
        'jwt_secret', COALESCE(jwt_secret, 'reallyreallyreallyreallyverysafesecret'),
        'jwt_aud', COALESCE(jwt_aud, 'localparts'),
        'current_jwt_claims', current_setting('request.jwt.claims', true)::jsonb,
        'role', current_setting('request.jwt.claims', true)::json->>'role'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION api.get_jwt_settings TO authenticated, anon;

CREATE VIEW api.jwt_settings AS SELECT api.get_jwt_settings() as settings;
GRANT SELECT ON api.jwt_settings TO authenticated, anon; 