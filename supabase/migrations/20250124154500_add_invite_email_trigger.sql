-- Create a function to send emails via Supabase Edge Functions
create or replace function public.handle_new_invite()
returns trigger
language plpgsql
security definer
as $$
declare
  project_name text;
begin
  -- Get the project name
  select name into project_name
  from zen_projects
  where id = NEW.project_id;

  -- Call Supabase Edge Function to send email
  perform net.http_post(
    url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-invite-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'projectName', project_name,
      'inviteType', NEW.role,
      'inviteId', NEW.id
    )
  );

  return NEW;
end;
$$;

-- Create trigger to send emails on new invites
create trigger on_invite_created
  after insert on public.zen_pending_invites
  for each row
  execute function public.handle_new_invite();
