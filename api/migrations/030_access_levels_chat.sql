-- 1) Messagerie : la clôture et la réouverture sont signées « TripVision », plus le nom d'une équipe.
UPDATE chat_messages SET body = 'Conversation clôturée par TripVision.'
 WHERE sender = 'system' AND body LIKE 'Conversation clôturée par %' AND body NOT LIKE '%automatiquement%';
UPDATE chat_messages SET body = 'Conversation rouverte par TripVision.'
 WHERE sender = 'system' AND body LIKE 'Conversation rouverte par %';

-- 2) Nouveaux niveaux d'accès (voir les réservations, la messagerie, les tendances, les clients, le journal) :
--    les comptes existants gardent ce qu'ils voyaient déjà.
UPDATE users SET permissions = COALESCE(permissions, '{}'::jsonb)
  || '{"bookings.view": true, "chats.reply": true, "trends.view": true, "clients.view": true, "audit.view": true}'::jsonb
 WHERE role = 'manager';
UPDATE users SET permissions = COALESCE(permissions, '{}'::jsonb)
  || '{"bookings.view": true, "chats.reply": true, "trends.view": true}'::jsonb
 WHERE role = 'admin';
