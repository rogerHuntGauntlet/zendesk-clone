#!/bin/bash
supabase link --project-ref rlaxacnkrfohotpyvnam \
  --password "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhhY25rcmZvaG90cHl2bmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjE5OTc2NywiZXhwIjoyMDUxNzc1NzY3fQ.J2Zx_EGAf-Uh0fo9qJGYzlGmy8txCtDfdXsHUWKCUFQ" \
  --db-url "postgresql://postgres:postgres@localhost:54322/postgres"
supabase db pull 