-- Bucket para assets do site (logo, favicon)
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Qualquer um pode ver (público)
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Apenas admins podem fazer upload/update/delete
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'site-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'site-assets'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);