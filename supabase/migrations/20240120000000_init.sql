-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create schemas
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;

-- Create auth schema tables
create table if not exists auth.users (
    instance_id uuid null,
    id uuid not null primary key,
    aud varchar(255),
    role varchar(255),
    email varchar(255),
    encrypted_password varchar(255),
    email_confirmed_at timestamptz,
    invited_at timestamptz,
    confirmation_token varchar(255),
    confirmation_sent_at timestamptz,
    recovery_token varchar(255),
    recovery_sent_at timestamptz,
    email_change_token_new varchar(255),
    email_change varchar(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin bool,
    created_at timestamptz,
    updated_at timestamptz,
    phone text null,
    phone_confirmed_at timestamptz null,
    phone_change text null,
    phone_change_token varchar(255) null,
    phone_change_sent_at timestamptz null,
    confirmed_at timestamptz null,
    email_change_token_current varchar(255) null,
    email_change_confirm_status smallint null,
    banned_until timestamptz null,
    reauthentication_token varchar(255) null,
    reauthentication_sent_at timestamptz null,
    is_sso_user bool not null default false,
    deleted_at timestamptz null
);

create table if not exists auth.refresh_tokens (
    instance_id uuid,
    id bigserial primary key,
    token varchar(255),
    user_id varchar(255),
    revoked boolean,
    created_at timestamptz,
    updated_at timestamptz,
    parent varchar(255)
);

-- Create the teams table
create table if not exists public.teams (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create the user_profiles table
create table if not exists public.user_profiles (
    id uuid references auth.users primary key,
    full_name text,
    team_id uuid references public.teams,
    role text not null check (role in ('admin', 'agent', 'customer')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
); 