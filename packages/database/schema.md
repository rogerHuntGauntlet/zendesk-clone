[
  {
    "json_build_object": {
      "tables": [
        {
          "table_name": "zen_activities",
          "columns": [
            {
              "column_name": "type",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "project_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "description",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_admins",
          "columns": [
            {
              "column_name": "permissions",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "managed_departments",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_article_categories",
          "columns": [
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "description",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "parent_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "article_count",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "name",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_article_feedback",
          "columns": [
            {
              "column_name": "is_helpful",
              "data_type": "boolean",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "article_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "comment",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_clients",
          "columns": [
            {
              "column_name": "active_tickets",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "plan",
              "data_type": "text",
              "column_default": "'standard'::text",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "company",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "total_tickets",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_courses",
          "columns": [
            {
              "column_name": "modules",
              "data_type": "jsonb",
              "column_default": "'[]'::jsonb",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "updated_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "type",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "category",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "description",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "title",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "progress",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "YES",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_employees",
          "columns": [
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "department",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "specialties",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "active_tickets",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "performance",
              "data_type": "jsonb",
              "column_default": "'{\"customerRating\": 0, \"avgResponseTime\": \"0h 0m\", \"resolvedTickets\": 0}'::jsonb",
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_knowledge_articles",
          "columns": [
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "not_helpful_count",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "helpful_count",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "view_count",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "related_articles",
              "data_type": "ARRAY",
              "column_default": "'{}'::uuid[]",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "status",
              "data_type": "text",
              "column_default": "'draft'::text",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "updated_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "author",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "tags",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "category",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "content",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "title",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_learning_progress",
          "columns": [
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "type",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "article_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "timestamp",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "metadata",
              "data_type": "jsonb",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_pending_invites",
          "columns": [
            {
              "column_name": "email",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "project_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "status",
              "data_type": "text",
              "column_default": "'pending'::text",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "invited_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "invited_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "role",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_performance_goals",
          "columns": [
            {
              "column_name": "end_date",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "metric",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "target",
              "data_type": "double precision",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "progress",
              "data_type": "double precision",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "unit",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "trend_value",
              "data_type": "double precision",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "trend_direction",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "timeframe",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "start_date",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_project_admins",
          "columns": [
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "projects",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "permissions",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_project_members",
          "columns": [
            {
              "column_name": "project_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "role",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "YES",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_projects",
          "columns": [
            {
              "column_name": "client_count",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "name",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "description",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "admin_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "employee_count",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "active_tickets",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_response_templates",
          "columns": [
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "current_version",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "tags",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "category",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "name",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_shared_templates",
          "columns": [
            {
              "column_name": "effectiveness_usage_count",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "effectiveness_success_rate",
              "data_type": "double precision",
              "column_default": "0",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "effectiveness_avg_response_time",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "template_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "reviewed_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "approval_comment",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "approval_status",
              "data_type": "text",
              "column_default": "'pending'::text",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "shared_with",
              "data_type": "ARRAY",
              "column_default": "'{}'::uuid[]",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "shared_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "reviewed_at",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_template_versions",
          "columns": [
            {
              "column_name": "template_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "content",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_ticket_attachments",
          "columns": [
            {
              "column_name": "url",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "name",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "ticket_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "uploaded_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "uploaded_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "type",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "size",
              "data_type": "integer",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_ticket_comments",
          "columns": [
            {
              "column_name": "created_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "is_internal",
              "data_type": "boolean",
              "column_default": "false",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "attachments",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "ticket_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "content",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_ticket_messages",
          "columns": [
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "uuid_generate_v4()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "source",
              "data_type": "USER-DEFINED",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "content",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "ticket_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "created_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "has_been_read",
              "data_type": "boolean",
              "column_default": "false",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "metadata",
              "data_type": "jsonb",
              "column_default": "'{}'::jsonb",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "YES",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_tickets",
          "columns": [
            {
              "column_name": "closed_at",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "project_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "searchable_text",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "has_feedback",
              "data_type": "boolean",
              "column_default": "false",
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "tags",
              "data_type": "ARRAY",
              "column_default": "'{}'::text[]",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "category",
              "data_type": "jsonb",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "title",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "status",
              "data_type": "USER-DEFINED",
              "column_default": "'new'::ticket_status",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "description",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "priority",
              "data_type": "USER-DEFINED",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_by",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "assigned_to",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "client",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "updated_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "resolved_at",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_time_entries",
          "columns": [
            {
              "column_name": "user_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "billable",
              "data_type": "boolean",
              "column_default": "true",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "category",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "description",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "duration",
              "data_type": "integer",
              "column_default": "0",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "end_time",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "start_time",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "ticket_id",
              "data_type": "uuid",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "updated_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        },
        {
          "table_name": "zen_users",
          "columns": [
            {
              "column_name": "role",
              "data_type": "USER-DEFINED",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "name",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "email",
              "data_type": "text",
              "column_default": null,
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "id",
              "data_type": "uuid",
              "column_default": "gen_random_uuid()",
              "is_nullable": "NO",
              "character_maximum_length": null
            },
            {
              "column_name": "last_login",
              "data_type": "timestamp with time zone",
              "column_default": null,
              "is_nullable": "YES",
              "character_maximum_length": null
            },
            {
              "column_name": "created_at",
              "data_type": "timestamp with time zone",
              "column_default": "now()",
              "is_nullable": "NO",
              "character_maximum_length": null
            }
          ]
        }
      ],
      "indexes": [
        {
          "tablename": "zen_pending_invites",
          "indexname": "zen_pending_invites_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_pending_invites_pkey ON public.zen_pending_invites USING btree (id)"
        },
        {
          "tablename": "zen_pending_invites",
          "indexname": "zen_pending_invites_email_project_id_key",
          "indexdef": "CREATE UNIQUE INDEX zen_pending_invites_email_project_id_key ON public.zen_pending_invites USING btree (email, project_id)"
        },
        {
          "tablename": "zen_pending_invites",
          "indexname": "idx_pending_invites_email",
          "indexdef": "CREATE INDEX idx_pending_invites_email ON public.zen_pending_invites USING btree (email)"
        },
        {
          "tablename": "zen_pending_invites",
          "indexname": "idx_pending_invites_project",
          "indexdef": "CREATE INDEX idx_pending_invites_project ON public.zen_pending_invites USING btree (project_id)"
        },
        {
          "tablename": "zen_pending_invites",
          "indexname": "idx_pending_invites_status",
          "indexdef": "CREATE INDEX idx_pending_invites_status ON public.zen_pending_invites USING btree (status)"
        },
        {
          "tablename": "zen_project_members",
          "indexname": "zen_project_members_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_project_members_pkey ON public.zen_project_members USING btree (id)"
        },
        {
          "tablename": "zen_project_members",
          "indexname": "zen_project_members_project_id_user_id_key",
          "indexdef": "CREATE UNIQUE INDEX zen_project_members_project_id_user_id_key ON public.zen_project_members USING btree (project_id, user_id)"
        },
        {
          "tablename": "zen_project_members",
          "indexname": "idx_project_members_project",
          "indexdef": "CREATE INDEX idx_project_members_project ON public.zen_project_members USING btree (project_id)"
        },
        {
          "tablename": "zen_project_members",
          "indexname": "idx_project_members_user",
          "indexdef": "CREATE INDEX idx_project_members_user ON public.zen_project_members USING btree (user_id)"
        },
        {
          "tablename": "zen_project_members",
          "indexname": "idx_project_members_role",
          "indexdef": "CREATE INDEX idx_project_members_role ON public.zen_project_members USING btree (role)"
        },
        {
          "tablename": "zen_activities",
          "indexname": "zen_activities_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_activities_pkey ON public.zen_activities USING btree (id)"
        },
        {
          "tablename": "zen_activities",
          "indexname": "idx_activities_project",
          "indexdef": "CREATE INDEX idx_activities_project ON public.zen_activities USING btree (project_id)"
        },
        {
          "tablename": "zen_activities",
          "indexname": "idx_activities_user",
          "indexdef": "CREATE INDEX idx_activities_user ON public.zen_activities USING btree (user_id)"
        },
        {
          "tablename": "zen_activities",
          "indexname": "idx_activities_created_at",
          "indexdef": "CREATE INDEX idx_activities_created_at ON public.zen_activities USING btree (created_at)"
        },
        {
          "tablename": "zen_ticket_messages",
          "indexname": "zen_ticket_messages_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_ticket_messages_pkey ON public.zen_ticket_messages USING btree (id)"
        },
        {
          "tablename": "zen_ticket_messages",
          "indexname": "zen_ticket_messages_ticket_id_idx",
          "indexdef": "CREATE INDEX zen_ticket_messages_ticket_id_idx ON public.zen_ticket_messages USING btree (ticket_id)"
        },
        {
          "tablename": "zen_ticket_messages",
          "indexname": "zen_ticket_messages_created_at_idx",
          "indexdef": "CREATE INDEX zen_ticket_messages_created_at_idx ON public.zen_ticket_messages USING btree (created_at)"
        },
        {
          "tablename": "zen_users",
          "indexname": "idx_users_role",
          "indexdef": "CREATE INDEX idx_users_role ON public.zen_users USING btree (role)"
        },
        {
          "tablename": "zen_users",
          "indexname": "zen_users_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_users_pkey ON public.zen_users USING btree (id)"
        },
        {
          "tablename": "zen_users",
          "indexname": "zen_users_email_key",
          "indexdef": "CREATE UNIQUE INDEX zen_users_email_key ON public.zen_users USING btree (email)"
        },
        {
          "tablename": "zen_users",
          "indexname": "idx_users_email",
          "indexdef": "CREATE INDEX idx_users_email ON public.zen_users USING btree (email)"
        },
        {
          "tablename": "zen_employees",
          "indexname": "idx_employees_department",
          "indexdef": "CREATE INDEX idx_employees_department ON public.zen_employees USING btree (department)"
        },
        {
          "tablename": "zen_employees",
          "indexname": "zen_employees_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_employees_pkey ON public.zen_employees USING btree (user_id)"
        },
        {
          "tablename": "zen_employees",
          "indexname": "idx_employees_specialties",
          "indexdef": "CREATE INDEX idx_employees_specialties ON public.zen_employees USING gin (specialties)"
        },
        {
          "tablename": "zen_employees",
          "indexname": "idx_employees_performance",
          "indexdef": "CREATE INDEX idx_employees_performance ON public.zen_employees USING gin (performance)"
        },
        {
          "tablename": "zen_admins",
          "indexname": "zen_admins_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_admins_pkey ON public.zen_admins USING btree (user_id)"
        },
        {
          "tablename": "zen_clients",
          "indexname": "zen_clients_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_clients_pkey ON public.zen_clients USING btree (user_id)"
        },
        {
          "tablename": "zen_project_admins",
          "indexname": "zen_project_admins_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_project_admins_pkey ON public.zen_project_admins USING btree (user_id)"
        },
        {
          "tablename": "zen_projects",
          "indexname": "zen_projects_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_projects_pkey ON public.zen_projects USING btree (id)"
        },
        {
          "tablename": "zen_projects",
          "indexname": "idx_projects_admin_id",
          "indexdef": "CREATE INDEX idx_projects_admin_id ON public.zen_projects USING btree (admin_id)"
        },
        {
          "tablename": "zen_projects",
          "indexname": "idx_projects_name",
          "indexdef": "CREATE INDEX idx_projects_name ON public.zen_projects USING btree (name)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_text_search",
          "indexdef": "CREATE INDEX idx_tickets_text_search ON public.zen_tickets USING gin (to_tsvector('english'::regconfig, searchable_text))"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "zen_tickets_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_tickets_pkey ON public.zen_tickets USING btree (id)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_status",
          "indexdef": "CREATE INDEX idx_tickets_status ON public.zen_tickets USING btree (status)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_priority",
          "indexdef": "CREATE INDEX idx_tickets_priority ON public.zen_tickets USING btree (priority)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_created_by",
          "indexdef": "CREATE INDEX idx_tickets_created_by ON public.zen_tickets USING btree (created_by)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_assigned_to",
          "indexdef": "CREATE INDEX idx_tickets_assigned_to ON public.zen_tickets USING btree (assigned_to)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_client",
          "indexdef": "CREATE INDEX idx_tickets_client ON public.zen_tickets USING btree (client)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_created_at",
          "indexdef": "CREATE INDEX idx_tickets_created_at ON public.zen_tickets USING btree (created_at)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_tags",
          "indexdef": "CREATE INDEX idx_tickets_tags ON public.zen_tickets USING gin (tags)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_category",
          "indexdef": "CREATE INDEX idx_tickets_category ON public.zen_tickets USING gin (category)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_searchable_text",
          "indexdef": "CREATE INDEX idx_tickets_searchable_text ON public.zen_tickets USING gin (to_tsvector('english'::regconfig, searchable_text))"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_status_date",
          "indexdef": "CREATE INDEX idx_tickets_status_date ON public.zen_tickets USING btree (status, created_at)"
        },
        {
          "tablename": "zen_tickets",
          "indexname": "idx_tickets_project",
          "indexdef": "CREATE INDEX idx_tickets_project ON public.zen_tickets USING btree (project_id)"
        },
        {
          "tablename": "zen_ticket_comments",
          "indexname": "idx_ticket_comments_ticket_id",
          "indexdef": "CREATE INDEX idx_ticket_comments_ticket_id ON public.zen_ticket_comments USING btree (ticket_id)"
        },
        {
          "tablename": "zen_ticket_comments",
          "indexname": "idx_ticket_comments_created_by",
          "indexdef": "CREATE INDEX idx_ticket_comments_created_by ON public.zen_ticket_comments USING btree (created_by)"
        },
        {
          "tablename": "zen_ticket_comments",
          "indexname": "zen_ticket_comments_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_ticket_comments_pkey ON public.zen_ticket_comments USING btree (id)"
        },
        {
          "tablename": "zen_ticket_attachments",
          "indexname": "zen_ticket_attachments_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_ticket_attachments_pkey ON public.zen_ticket_attachments USING btree (id)"
        },
        {
          "tablename": "zen_ticket_attachments",
          "indexname": "idx_ticket_attachments_ticket_id",
          "indexdef": "CREATE INDEX idx_ticket_attachments_ticket_id ON public.zen_ticket_attachments USING btree (ticket_id)"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "idx_knowledge_articles_title",
          "indexdef": "CREATE INDEX idx_knowledge_articles_title ON public.zen_knowledge_articles USING btree (title)"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "idx_knowledge_articles_category",
          "indexdef": "CREATE INDEX idx_knowledge_articles_category ON public.zen_knowledge_articles USING btree (category)"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "idx_knowledge_articles_author",
          "indexdef": "CREATE INDEX idx_knowledge_articles_author ON public.zen_knowledge_articles USING btree (author)"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "idx_knowledge_articles_status",
          "indexdef": "CREATE INDEX idx_knowledge_articles_status ON public.zen_knowledge_articles USING btree (status)"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "zen_knowledge_articles_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_knowledge_articles_pkey ON public.zen_knowledge_articles USING btree (id)"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "idx_knowledge_articles_tags",
          "indexdef": "CREATE INDEX idx_knowledge_articles_tags ON public.zen_knowledge_articles USING gin (tags)"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "idx_knowledge_articles_content_search",
          "indexdef": "CREATE INDEX idx_knowledge_articles_content_search ON public.zen_knowledge_articles USING gin (to_tsvector('english'::regconfig, content))"
        },
        {
          "tablename": "zen_knowledge_articles",
          "indexname": "idx_knowledge_articles_title_content",
          "indexdef": "CREATE INDEX idx_knowledge_articles_title_content ON public.zen_knowledge_articles USING gin (to_tsvector('english'::regconfig, ((title || ' '::text) || content)))"
        },
        {
          "tablename": "zen_article_categories",
          "indexname": "zen_article_categories_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_article_categories_pkey ON public.zen_article_categories USING btree (id)"
        },
        {
          "tablename": "zen_article_feedback",
          "indexname": "zen_article_feedback_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_article_feedback_pkey ON public.zen_article_feedback USING btree (id)"
        },
        {
          "tablename": "zen_article_feedback",
          "indexname": "idx_article_feedback_helpful_date",
          "indexdef": "CREATE INDEX idx_article_feedback_helpful_date ON public.zen_article_feedback USING btree (is_helpful, created_at)"
        },
        {
          "tablename": "zen_learning_progress",
          "indexname": "idx_learning_progress_user_article",
          "indexdef": "CREATE INDEX idx_learning_progress_user_article ON public.zen_learning_progress USING btree (user_id, article_id)"
        },
        {
          "tablename": "zen_learning_progress",
          "indexname": "zen_learning_progress_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_learning_progress_pkey ON public.zen_learning_progress USING btree (id)"
        },
        {
          "tablename": "zen_learning_progress",
          "indexname": "idx_learning_progress_user",
          "indexdef": "CREATE INDEX idx_learning_progress_user ON public.zen_learning_progress USING btree (user_id)"
        },
        {
          "tablename": "zen_learning_progress",
          "indexname": "idx_learning_progress_article",
          "indexdef": "CREATE INDEX idx_learning_progress_article ON public.zen_learning_progress USING btree (article_id)"
        },
        {
          "tablename": "zen_learning_progress",
          "indexname": "idx_learning_progress_type",
          "indexdef": "CREATE INDEX idx_learning_progress_type ON public.zen_learning_progress USING btree (type)"
        },
        {
          "tablename": "zen_time_entries",
          "indexname": "idx_time_entries_ticket",
          "indexdef": "CREATE INDEX idx_time_entries_ticket ON public.zen_time_entries USING btree (ticket_id)"
        },
        {
          "tablename": "zen_time_entries",
          "indexname": "idx_time_entries_user",
          "indexdef": "CREATE INDEX idx_time_entries_user ON public.zen_time_entries USING btree (user_id)"
        },
        {
          "tablename": "zen_time_entries",
          "indexname": "zen_time_entries_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_time_entries_pkey ON public.zen_time_entries USING btree (id)"
        },
        {
          "tablename": "zen_time_entries",
          "indexname": "idx_time_entries_date",
          "indexdef": "CREATE INDEX idx_time_entries_date ON public.zen_time_entries USING btree (start_time)"
        },
        {
          "tablename": "zen_time_entries",
          "indexname": "idx_time_entries_user_date",
          "indexdef": "CREATE INDEX idx_time_entries_user_date ON public.zen_time_entries USING btree (user_id, start_time)"
        },
        {
          "tablename": "zen_courses",
          "indexname": "idx_courses_category",
          "indexdef": "CREATE INDEX idx_courses_category ON public.zen_courses USING btree (category)"
        },
        {
          "tablename": "zen_courses",
          "indexname": "zen_courses_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_courses_pkey ON public.zen_courses USING btree (id)"
        },
        {
          "tablename": "zen_courses",
          "indexname": "idx_courses_type",
          "indexdef": "CREATE INDEX idx_courses_type ON public.zen_courses USING btree (type)"
        },
        {
          "tablename": "zen_courses",
          "indexname": "idx_courses_modules",
          "indexdef": "CREATE INDEX idx_courses_modules ON public.zen_courses USING gin (modules)"
        },
        {
          "tablename": "zen_response_templates",
          "indexname": "zen_response_templates_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_response_templates_pkey ON public.zen_response_templates USING btree (id)"
        },
        {
          "tablename": "zen_response_templates",
          "indexname": "idx_response_templates_category",
          "indexdef": "CREATE INDEX idx_response_templates_category ON public.zen_response_templates USING btree (category)"
        },
        {
          "tablename": "zen_response_templates",
          "indexname": "idx_response_templates_tags",
          "indexdef": "CREATE INDEX idx_response_templates_tags ON public.zen_response_templates USING gin (tags)"
        },
        {
          "tablename": "zen_template_versions",
          "indexname": "zen_template_versions_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_template_versions_pkey ON public.zen_template_versions USING btree (id)"
        },
        {
          "tablename": "zen_template_versions",
          "indexname": "idx_template_versions_template",
          "indexdef": "CREATE INDEX idx_template_versions_template ON public.zen_template_versions USING btree (template_id)"
        },
        {
          "tablename": "zen_shared_templates",
          "indexname": "zen_shared_templates_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_shared_templates_pkey ON public.zen_shared_templates USING btree (id)"
        },
        {
          "tablename": "zen_shared_templates",
          "indexname": "idx_shared_templates_status",
          "indexdef": "CREATE INDEX idx_shared_templates_status ON public.zen_shared_templates USING btree (approval_status)"
        },
        {
          "tablename": "zen_shared_templates",
          "indexname": "idx_shared_templates_shared_with",
          "indexdef": "CREATE INDEX idx_shared_templates_shared_with ON public.zen_shared_templates USING gin (shared_with)"
        },
        {
          "tablename": "zen_shared_templates",
          "indexname": "idx_shared_templates_template_id",
          "indexdef": "CREATE INDEX idx_shared_templates_template_id ON public.zen_shared_templates USING btree (template_id)"
        },
        {
          "tablename": "zen_performance_goals",
          "indexname": "zen_performance_goals_pkey",
          "indexdef": "CREATE UNIQUE INDEX zen_performance_goals_pkey ON public.zen_performance_goals USING btree (id)"
        },
        {
          "tablename": "zen_performance_goals",
          "indexname": "idx_performance_goals_user",
          "indexdef": "CREATE INDEX idx_performance_goals_user ON public.zen_performance_goals USING btree (user_id)"
        },
        {
          "tablename": "zen_performance_goals",
          "indexname": "idx_performance_goals_metric",
          "indexdef": "CREATE INDEX idx_performance_goals_metric ON public.zen_performance_goals USING btree (metric)"
        }
      ],
      "constraints": [
        {
          "table_name": "zen_pending_invites",
          "constraint_name": "zen_pending_invites_email_project_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "email",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_pending_invites",
          "constraint_name": "zen_pending_invites_email_project_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "email",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_pending_invites",
          "constraint_name": "zen_pending_invites_email_project_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "project_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_pending_invites",
          "constraint_name": "zen_pending_invites_email_project_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "project_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_pending_invites",
          "constraint_name": "zen_pending_invites_invited_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "invited_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_pending_invites",
          "constraint_name": "zen_pending_invites_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_pending_invites",
          "constraint_name": "zen_pending_invites_project_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "project_id",
          "foreign_key_reference": "zen_projects(id)"
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "fk_project_members_project",
          "constraint_type": "FOREIGN KEY",
          "column_name": "project_id",
          "foreign_key_reference": "zen_projects(id)"
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "fk_project_members_user",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "zen_project_members_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "zen_project_members_project_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "project_id",
          "foreign_key_reference": "zen_projects(id)"
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "zen_project_members_project_id_user_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "project_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "zen_project_members_project_id_user_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "project_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "zen_project_members_project_id_user_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "user_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "zen_project_members_project_id_user_id_key",
          "constraint_type": "UNIQUE",
          "column_name": "user_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_project_members",
          "constraint_name": "zen_project_members_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_activities",
          "constraint_name": "zen_activities_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_activities",
          "constraint_name": "zen_activities_project_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "project_id",
          "foreign_key_reference": "zen_projects(id)"
        },
        {
          "table_name": "zen_activities",
          "constraint_name": "zen_activities_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_ticket_messages",
          "constraint_name": "zen_ticket_messages_created_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "created_by",
          "foreign_key_reference": "users(id)"
        },
        {
          "table_name": "zen_ticket_messages",
          "constraint_name": "zen_ticket_messages_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_ticket_messages",
          "constraint_name": "zen_ticket_messages_ticket_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "ticket_id",
          "foreign_key_reference": "zen_tickets(id)"
        },
        {
          "table_name": "zen_users",
          "constraint_name": "zen_users_email_key",
          "constraint_type": "UNIQUE",
          "column_name": "email",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_users",
          "constraint_name": "zen_users_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_employees",
          "constraint_name": "fk_employees_user",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_employees",
          "constraint_name": "zen_employees_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "user_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_employees",
          "constraint_name": "zen_employees_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_admins",
          "constraint_name": "fk_admins_user",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_admins",
          "constraint_name": "zen_admins_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "user_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_admins",
          "constraint_name": "zen_admins_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_clients",
          "constraint_name": "fk_clients_user",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_clients",
          "constraint_name": "zen_clients_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "user_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_clients",
          "constraint_name": "zen_clients_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_project_admins",
          "constraint_name": "fk_project_admins_user",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_project_admins",
          "constraint_name": "zen_project_admins_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "user_id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_project_admins",
          "constraint_name": "zen_project_admins_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_projects",
          "constraint_name": "fk_projects_admin",
          "constraint_type": "FOREIGN KEY",
          "column_name": "admin_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_projects",
          "constraint_name": "zen_projects_admin_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "admin_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_projects",
          "constraint_name": "zen_projects_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_tickets",
          "constraint_name": "zen_tickets_assigned_to_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "assigned_to",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_tickets",
          "constraint_name": "zen_tickets_client_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "client",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_tickets",
          "constraint_name": "zen_tickets_created_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "created_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_tickets",
          "constraint_name": "zen_tickets_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_tickets",
          "constraint_name": "zen_tickets_project_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "project_id",
          "foreign_key_reference": "zen_projects(id)"
        },
        {
          "table_name": "zen_ticket_comments",
          "constraint_name": "zen_ticket_comments_created_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "created_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_ticket_comments",
          "constraint_name": "zen_ticket_comments_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_ticket_comments",
          "constraint_name": "zen_ticket_comments_ticket_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "ticket_id",
          "foreign_key_reference": "zen_tickets(id)"
        },
        {
          "table_name": "zen_ticket_attachments",
          "constraint_name": "zen_ticket_attachments_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_ticket_attachments",
          "constraint_name": "zen_ticket_attachments_ticket_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "ticket_id",
          "foreign_key_reference": "zen_tickets(id)"
        },
        {
          "table_name": "zen_ticket_attachments",
          "constraint_name": "zen_ticket_attachments_uploaded_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "uploaded_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_knowledge_articles",
          "constraint_name": "fk_knowledge_articles_author",
          "constraint_type": "FOREIGN KEY",
          "column_name": "author",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_knowledge_articles",
          "constraint_name": "fk_knowledge_articles_category",
          "constraint_type": "FOREIGN KEY",
          "column_name": "category",
          "foreign_key_reference": "zen_article_categories(id)"
        },
        {
          "table_name": "zen_knowledge_articles",
          "constraint_name": "zen_knowledge_articles_author_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "author",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_knowledge_articles",
          "constraint_name": "zen_knowledge_articles_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_article_categories",
          "constraint_name": "fk_article_categories_parent",
          "constraint_type": "FOREIGN KEY",
          "column_name": "parent_id",
          "foreign_key_reference": "zen_article_categories(id)"
        },
        {
          "table_name": "zen_article_categories",
          "constraint_name": "zen_article_categories_parent_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "parent_id",
          "foreign_key_reference": "zen_article_categories(id)"
        },
        {
          "table_name": "zen_article_categories",
          "constraint_name": "zen_article_categories_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_article_feedback",
          "constraint_name": "fk_article_feedback_article",
          "constraint_type": "FOREIGN KEY",
          "column_name": "article_id",
          "foreign_key_reference": "zen_knowledge_articles(id)"
        },
        {
          "table_name": "zen_article_feedback",
          "constraint_name": "fk_article_feedback_user",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_article_feedback",
          "constraint_name": "zen_article_feedback_article_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "article_id",
          "foreign_key_reference": "zen_knowledge_articles(id)"
        },
        {
          "table_name": "zen_article_feedback",
          "constraint_name": "zen_article_feedback_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_article_feedback",
          "constraint_name": "zen_article_feedback_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_learning_progress",
          "constraint_name": "fk_learning_progress_article",
          "constraint_type": "FOREIGN KEY",
          "column_name": "article_id",
          "foreign_key_reference": "zen_knowledge_articles(id)"
        },
        {
          "table_name": "zen_learning_progress",
          "constraint_name": "fk_learning_progress_user",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_learning_progress",
          "constraint_name": "zen_learning_progress_article_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "article_id",
          "foreign_key_reference": "zen_knowledge_articles(id)"
        },
        {
          "table_name": "zen_learning_progress",
          "constraint_name": "zen_learning_progress_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_learning_progress",
          "constraint_name": "zen_learning_progress_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_time_entries",
          "constraint_name": "zen_time_entries_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_time_entries",
          "constraint_name": "zen_time_entries_ticket_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "ticket_id",
          "foreign_key_reference": "zen_tickets(id)"
        },
        {
          "table_name": "zen_time_entries",
          "constraint_name": "zen_time_entries_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_courses",
          "constraint_name": "zen_courses_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_response_templates",
          "constraint_name": "fk_response_templates_creator",
          "constraint_type": "FOREIGN KEY",
          "column_name": "created_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_response_templates",
          "constraint_name": "zen_response_templates_created_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "created_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_response_templates",
          "constraint_name": "zen_response_templates_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_template_versions",
          "constraint_name": "fk_template_versions_creator",
          "constraint_type": "FOREIGN KEY",
          "column_name": "created_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_template_versions",
          "constraint_name": "fk_template_versions_template",
          "constraint_type": "FOREIGN KEY",
          "column_name": "template_id",
          "foreign_key_reference": "zen_response_templates(id)"
        },
        {
          "table_name": "zen_template_versions",
          "constraint_name": "zen_template_versions_created_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "created_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_template_versions",
          "constraint_name": "zen_template_versions_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_template_versions",
          "constraint_name": "zen_template_versions_template_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "template_id",
          "foreign_key_reference": "zen_response_templates(id)"
        },
        {
          "table_name": "zen_shared_templates",
          "constraint_name": "fk_shared_templates_reviewer",
          "constraint_type": "FOREIGN KEY",
          "column_name": "reviewed_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_shared_templates",
          "constraint_name": "fk_shared_templates_sharer",
          "constraint_type": "FOREIGN KEY",
          "column_name": "shared_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_shared_templates",
          "constraint_name": "fk_shared_templates_template",
          "constraint_type": "FOREIGN KEY",
          "column_name": "template_id",
          "foreign_key_reference": "zen_response_templates(id)"
        },
        {
          "table_name": "zen_shared_templates",
          "constraint_name": "zen_shared_templates_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_shared_templates",
          "constraint_name": "zen_shared_templates_reviewed_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "reviewed_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_shared_templates",
          "constraint_name": "zen_shared_templates_shared_by_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "shared_by",
          "foreign_key_reference": "zen_users(id)"
        },
        {
          "table_name": "zen_shared_templates",
          "constraint_name": "zen_shared_templates_template_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "template_id",
          "foreign_key_reference": "zen_response_templates(id)"
        },
        {
          "table_name": "zen_performance_goals",
          "constraint_name": "zen_performance_goals_pkey",
          "constraint_type": "PRIMARY KEY",
          "column_name": "id",
          "foreign_key_reference": null
        },
        {
          "table_name": "zen_performance_goals",
          "constraint_name": "zen_performance_goals_user_id_fkey",
          "constraint_type": "FOREIGN KEY",
          "column_name": "user_id",
          "foreign_key_reference": "zen_users(id)"
        }
      ]
    }
  }
]