-- database/init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    language_pref VARCHAR(20) DEFAULT 'english'
);

CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 0.0,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    raw_text TEXT NOT NULL,
    parsed_intent JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES service_requests(id),
    provider_id UUID REFERENCES providers(id),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES service_requests(id),
    agent_name VARCHAR(100) NOT NULL,
    step_description TEXT NOT NULL,
    reasoning JSONB,
    tool_calls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed mock data
INSERT INTO providers (name, service_type, latitude, longitude, rating, is_available) VALUES
('Ali AC Services', 'AC Technician', 33.6491, 72.9818, 4.8, TRUE),
('Kamran Plumbers', 'Plumber', 33.6510, 72.9840, 4.2, TRUE),
('Sana Beauty Salon', 'Beautician', 33.6480, 72.9790, 4.9, TRUE),
('Ahmed Electric', 'Electrician', 33.6530, 72.9860, 4.0, TRUE),
('Usman Tutor', 'Tutor', 33.6450, 72.9750, 4.5, FALSE);

INSERT INTO users (name, phone_number, language_pref) VALUES
('Test User', '+923001234567', 'urdu');
