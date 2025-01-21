-- Employee performance view
CREATE OR REPLACE VIEW employee_performance_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    e.department,
    e.specialties,
    e.active_tickets,
    e.performance->>'customerRating' as customer_rating,
    e.performance->>'avgResponseTime' as avg_response_time,
    e.performance->>'resolvedTickets' as resolved_tickets,
    COUNT(DISTINCT t.id) as total_tickets_handled,
    COUNT(DISTINCT CASE WHEN t.status = 'closed' THEN t.id END) as closed_tickets,
    AVG(EXTRACT(epoch FROM (t.resolved_at - t.created_at))/3600)::numeric(10,2) as avg_resolution_time_hours
FROM zen_users u
JOIN zen_employees e ON e.user_id = u.id
LEFT JOIN zen_tickets t ON t.assigned_to = u.id
GROUP BY u.id, u.name, u.email, e.department, e.specialties, e.active_tickets, e.performance;

-- Knowledge base analytics view
CREATE OR REPLACE VIEW knowledge_base_analytics AS
SELECT 
    ka.id,
    ka.title,
    ka.status,
    ka.view_count,
    ka.helpful_count,
    ka.not_helpful_count,
    (ka.helpful_count::float / NULLIF(ka.helpful_count + ka.not_helpful_count, 0) * 100)::numeric(5,2) as helpfulness_percentage,
    COUNT(DISTINCT af.id) as feedback_count,
    COUNT(DISTINCT lp.id) as learning_interactions,
    ac.name as category_name
FROM zen_knowledge_articles ka
LEFT JOIN zen_article_feedback af ON af.article_id = ka.id
LEFT JOIN zen_learning_progress lp ON lp.article_id = ka.id
LEFT JOIN zen_article_categories ac ON ac.id = ka.category
GROUP BY ka.id, ka.title, ka.status, ka.view_count, ka.helpful_count, ka.not_helpful_count, ac.name; 