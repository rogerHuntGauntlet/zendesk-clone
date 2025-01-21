# Database Schema

This directory contains the database schema definitions and supporting objects for the ZenDesk clone project.

## Files

- `schema.json` - Complete database schema including tables, indexes, and constraints
- `types.sql` - Custom PostgreSQL types and enums (user roles, ticket statuses)
- `functions.sql` - Trigger functions for maintaining data consistency
- `triggers.sql` - Database triggers for automated behaviors
- `views.sql` - Analytics and reporting views

## When to Use

### Development Setup
When setting up a new development environment:
1. Create the database
2. Run `types.sql` first (required for table creation)
3. Create tables using schema definitions
4. Run `functions.sql` and `triggers.sql`
5. Finally, create `views.sql` 

### Adding Features
When adding new features:
1. Reference `schema.json` for existing structure
2. Add new types to `types.sql` if needed
3. Add any required triggers/functions
4. Update views if they reference modified tables

### Debugging
These files help understand:
- How counters are maintained (`functions.sql`)
- What triggers exist (`triggers.sql`)
- Available analytics views (`views.sql`)

## Note
Currently, we're using Supabase which handles most of the database setup. These files serve as reference and will be needed if we:
- Need to modify the schema
- Want to add new automated behaviors
- Need to create new analytics views 