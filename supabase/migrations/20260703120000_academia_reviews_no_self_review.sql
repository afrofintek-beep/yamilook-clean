-- Prevent self-reviews on academia_reviews.
--
-- The original INSERT policy only checked auth.uid() = reviewer_id, which let
-- a mentor insert a review for their own session (reviewer_id = mentor_id).
-- Guard it at the data layer, not just the UI:
--   1. A CHECK constraint (reviewer_id <> mentor_id) — a hard invariant that
--      holds no matter how the row is inserted.
--   2. A stronger INSERT policy that also verifies the claimed mentor_id is the
--      session's actual mentor, so the check can't be bypassed by forging
--      mentor_id.

-- 1. Hard invariant: a review's author can never be its subject.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.academia_reviews'::regclass
      AND conname = 'academia_reviews_no_self_review'
  ) THEN
    ALTER TABLE public.academia_reviews
      ADD CONSTRAINT academia_reviews_no_self_review CHECK (reviewer_id <> mentor_id);
  END IF;
END $$;

-- 2. Recreate the INSERT policy with mentor-integrity + self-review guards.
DROP POLICY IF EXISTS "Users can create reviews" ON public.academia_reviews;

CREATE POLICY "Users can create reviews"
  ON public.academia_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewer_id <> mentor_id
    AND mentor_id = (
      SELECT s.mentor_id FROM public.academia_sessions s WHERE s.id = session_id
    )
  );
