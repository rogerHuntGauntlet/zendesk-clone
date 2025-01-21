-- Ticket counter triggers
DROP TRIGGER IF EXISTS trigger_ticket_counters ON zen_tickets;
CREATE TRIGGER trigger_ticket_counters
    AFTER INSERT OR UPDATE ON zen_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_counters();

-- Article counter triggers
DROP TRIGGER IF EXISTS trigger_article_counters ON zen_knowledge_articles;
CREATE TRIGGER trigger_article_counters
    AFTER INSERT OR UPDATE OR DELETE ON zen_knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_counters();

-- Update ticket searchable text
CREATE OR REPLACE FUNCTION update_ticket_search_text()
RETURNS TRIGGER AS $$
BEGIN
    NEW.searchable_text := NEW.title || ' ' || NEW.description;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_search_text ON zen_tickets;
CREATE TRIGGER trigger_ticket_search_text
    BEFORE INSERT OR UPDATE ON zen_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_search_text(); 