-- Update ticket counters
CREATE OR REPLACE FUNCTION update_ticket_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment counters
        UPDATE zen_clients 
        SET total_tickets = total_tickets + 1,
            active_tickets = active_tickets + 1
        WHERE user_id = NEW.client;
        
        IF NEW.assigned_to IS NOT NULL THEN
            UPDATE zen_employees
            SET active_tickets = active_tickets + 1
            WHERE user_id = NEW.assigned_to;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
            UPDATE zen_clients 
            SET active_tickets = active_tickets - 1
            WHERE user_id = NEW.client;
            
            IF NEW.assigned_to IS NOT NULL THEN
                UPDATE zen_employees
                SET active_tickets = active_tickets - 1
                WHERE user_id = NEW.assigned_to;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update article counters
CREATE OR REPLACE FUNCTION update_article_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE zen_article_categories
        SET article_count = article_count + 1
        WHERE id = NEW.category;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE zen_article_categories
        SET article_count = article_count - 1
        WHERE id = OLD.category;
    ELSIF TG_OP = 'UPDATE' AND NEW.category != OLD.category THEN
        UPDATE zen_article_categories
        SET article_count = article_count - 1
        WHERE id = OLD.category;
        
        UPDATE zen_article_categories
        SET article_count = article_count + 1
        WHERE id = NEW.category;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 