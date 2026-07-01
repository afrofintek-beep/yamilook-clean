-- Remove duplicate/legacy SELECT policy that conflicts with can_view_post
DROP POLICY IF EXISTS "Users can view posts based on privacy" ON public.posts;

-- Also remove duplicate insert/update/delete policies (legacy names)
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;