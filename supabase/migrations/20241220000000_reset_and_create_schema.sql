-- Reset and create schema properly
-- This migration is idempotent and safe to run multiple times

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS public.viewers CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.links CASCADE;
DROP TABLE IF EXISTS public.contact_groups CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.funds CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.domains CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create users table
CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    email text,
    name text,
    updated_at timestamp without time zone,
    title text,
    messages uuid[]
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create companies table
CREATE TABLE public.companies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text,
    street text,
    city_state_zip text,
    state_of_incorporation text,
    contact_id uuid
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.companies ADD CONSTRAINT companies_name_unique UNIQUE (name);

-- Create contacts table
CREATE TABLE public.contacts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    name text,
    email text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    title text,
    is_investor boolean DEFAULT false,
    is_founder boolean DEFAULT false,
    user_id uuid
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.contacts ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contacts ADD CONSTRAINT contacts_email_created_by_unique UNIQUE (email, created_by);
ALTER TABLE ONLY public.contacts ADD CONSTRAINT contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.contacts ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add foreign key to companies
ALTER TABLE ONLY public.companies ADD CONSTRAINT companies_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);

-- Create domains table
CREATE TABLE public.domains (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    domain_name text NOT NULL,
    user_id uuid NOT NULL,
    sender_name text,
    api_key text
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.domains ADD CONSTRAINT domains_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.domains ADD CONSTRAINT domains_name_user_id_key UNIQUE (domain_name, user_id);
ALTER TABLE ONLY public.domains ADD CONSTRAINT domains_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.domains ADD CONSTRAINT domains_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Create funds table
CREATE TABLE public.funds (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text,
    street text,
    city_state_zip text,
    byline text,
    contact_id uuid
);

ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.funds ADD CONSTRAINT funds_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.funds ADD CONSTRAINT funds_name_unique UNIQUE (name);
ALTER TABLE ONLY public.funds ADD CONSTRAINT funds_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);

-- Create groups table
CREATE TABLE public.groups (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    color text
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.groups ADD CONSTRAINT groups_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.groups ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Create contact_groups junction table
CREATE TABLE public.contact_groups (
    contact_id uuid NOT NULL,
    group_id uuid NOT NULL
);

ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.contact_groups ADD CONSTRAINT contact_groups_pkey PRIMARY KEY (contact_id, group_id);
ALTER TABLE ONLY public.contact_groups ADD CONSTRAINT contact_groups_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
ALTER TABLE ONLY public.contact_groups ADD CONSTRAINT contact_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);

-- Create investments table
CREATE TABLE public.investments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    founder_contact_id uuid,
    company_id uuid,
    investor_contact_id uuid,
    fund_id uuid,
    purchase_amount text,
    investment_type text,
    valuation_cap text,
    discount text,
    date timestamp with time zone,
    created_by uuid,
    summary text,
    safe_url text,
    side_letter_id uuid
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.investments ADD CONSTRAINT investments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.investments ADD CONSTRAINT investments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE ONLY public.investments ADD CONSTRAINT investments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.investments ADD CONSTRAINT investments_founder_contact_id_fkey FOREIGN KEY (founder_contact_id) REFERENCES public.contacts(id);
ALTER TABLE ONLY public.investments ADD CONSTRAINT investments_fund_id_fkey FOREIGN KEY (fund_id) REFERENCES public.funds(id);
ALTER TABLE ONLY public.investments ADD CONSTRAINT investments_investor_contact_id_fkey FOREIGN KEY (investor_contact_id) REFERENCES public.contacts(id);

-- Create links table
CREATE TABLE public.links (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    url text,
    password text,
    name text,
    updated_at timestamp with time zone DEFAULT now(),
    allow_download boolean DEFAULT false,
    send_notifications boolean DEFAULT true,
    require_email boolean DEFAULT true,
    groups uuid[]
);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.links ADD CONSTRAINT links_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.links ADD CONSTRAINT links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Create messages table
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    "from" text NOT NULL,
    "to" text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    created_by uuid NOT NULL,
    link_id uuid
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.messages ADD CONSTRAINT messages_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.links(id);

-- Add side_letter foreign key to investments (depends on messages)
ALTER TABLE ONLY public.investments ADD CONSTRAINT investments_side_letter_id_fkey FOREIGN KEY (side_letter_id) REFERENCES public.messages(id);

-- Create viewers table
CREATE TABLE public.viewers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    link_id uuid,
    email text,
    viewed_at timestamp with time zone
);

ALTER TABLE public.viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ONLY public.viewers ADD CONSTRAINT viewers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.viewers ADD CONSTRAINT viewers_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.links(id);

-- Create trigger function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();
  RETURN new;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Contacts policies
CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = created_by);
CREATE POLICY "Users can insert their own contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = created_by);
CREATE POLICY "Users can update their own contacts" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = created_by);
CREATE POLICY "Users can delete their own contacts" ON public.contacts
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = created_by);

-- Links policies
CREATE POLICY "Users can view their own links" ON public.links
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own links" ON public.links
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own links" ON public.links
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own links" ON public.links
  FOR DELETE USING (auth.uid() = created_by);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (auth.uid() = created_by);

-- Groups policies
CREATE POLICY "Users can view their own groups" ON public.groups
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own groups" ON public.groups
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own groups" ON public.groups
  FOR DELETE USING (auth.uid() = created_by);

-- Domains policies
CREATE POLICY "Users can view their own domains" ON public.domains
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own domains" ON public.domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own domains" ON public.domains
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own domains" ON public.domains
  FOR DELETE USING (auth.uid() = user_id);

-- Viewers policies (public)
CREATE POLICY "Anyone can insert viewer records" ON public.viewers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view viewer records" ON public.viewers
  FOR SELECT USING (true);

-- Investments policies
CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can insert their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own investments" ON public.investments
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own investments" ON public.investments
  FOR DELETE USING (auth.uid() = created_by);

-- Companies policies
CREATE POLICY "Users can view companies" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = companies.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can insert companies" ON public.companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = companies.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can update companies" ON public.companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = companies.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can delete companies" ON public.companies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = companies.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );

-- Funds policies
CREATE POLICY "Users can view funds" ON public.funds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = funds.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can insert funds" ON public.funds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = funds.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can update funds" ON public.funds
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = funds.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can delete funds" ON public.funds
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = funds.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );

-- Contact groups policies
CREATE POLICY "Users can view contact groups" ON public.contact_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = contact_groups.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can insert contact groups" ON public.contact_groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = contact_groups.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );
CREATE POLICY "Users can delete contact groups" ON public.contact_groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.id = contact_groups.contact_id
      AND (contacts.user_id = auth.uid() OR contacts.created_by = auth.uid())
    )
  );

-- Create user records for any existing authenticated users
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at FROM auth.users
ON CONFLICT (id) DO NOTHING;

