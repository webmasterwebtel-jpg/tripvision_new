-- Les partenaires publient leurs annonces sans validation préalable de TripVision.
UPDATE vehicles SET status = 'approved' WHERE status = 'pending' AND partner_id IS NOT NULL AND deleted_at IS NULL;
