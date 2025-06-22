-- Initialize EHR MVP Database
-- This script creates additional database objects if needed

-- Create test database for running tests
CREATE DATABASE ehr_mvp_test;

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON DATABASE ehr_mvp TO ehr_user;
GRANT ALL PRIVILEGES ON DATABASE ehr_mvp_test TO ehr_user;

-- Create extensions if needed
\c ehr_mvp;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c ehr_mvp_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Switch back to main database
\c ehr_mvp;

-- Create indexes for better performance (will be created by SQLAlchemy, but kept for reference)
-- These will be automatically created by the application models

-- Audit trigger function for tracking changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to generate patient IDs (fallback if application logic fails)
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
DECLARE
    last_id INTEGER;
    new_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 2) AS INTEGER)), 0) INTO last_id
    FROM patients
    WHERE patient_id ~ '^P[0-9]+$';
    
    new_id := last_id + 1;
    RETURN 'P' || LPAD(new_id::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate encounter IDs (fallback if application logic fails)
CREATE OR REPLACE FUNCTION generate_encounter_id()
RETURNS TEXT AS $$
DECLARE
    last_id INTEGER;
    new_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(encounter_id FROM 2) AS INTEGER)), 0) INTO last_id
    FROM encounters
    WHERE encounter_id ~ '^E[0-9]+$';
    
    new_id := last_id + 1;
    RETURN 'E' || LPAD(new_id::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;