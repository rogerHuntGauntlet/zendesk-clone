-- Function to get team activities for a project
CREATE OR REPLACE FUNCTION get_team_activities(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  ticket_id UUID,
  ticket_title TEXT,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH project_tickets AS (
    SELECT id as ticket_id 
    FROM zen_tickets 
    WHERE project_id = p_project_id
  )
  SELECT 
    ta.id,
    ta.activity_type,
    ta.content,
    ta.created_at,
    ta.created_by,
    t.id as ticket_id,
    t.title as ticket_title,
    u.name as user_name,
    u.email as user_email,
    pm.role as user_role
  FROM zen_ticket_activities ta
  JOIN project_tickets pt ON ta.ticket_id = pt.ticket_id
  JOIN zen_tickets t ON t.id = pt.ticket_id
  JOIN zen_users u ON u.id = ta.created_by
  JOIN zen_project_members pm ON pm.user_id = u.id AND pm.project_id = p_project_id
  ORDER BY ta.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 