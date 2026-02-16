-- Create storage bucket for car race videos
INSERT INTO storage.buckets (id, name, public) VALUES ('car-videos', 'car-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read car videos (public bucket)
CREATE POLICY "Car videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-videos');

-- Only admins can upload car videos
CREATE POLICY "Admins can upload car videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'car-videos' AND has_role(auth.uid(), 'admin'));

-- Only admins can update car videos
CREATE POLICY "Admins can update car videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'car-videos' AND has_role(auth.uid(), 'admin'));

-- Only admins can delete car videos
CREATE POLICY "Admins can delete car videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'car-videos' AND has_role(auth.uid(), 'admin'));

-- Table to track which videos are assigned to which marketplace car
CREATE TABLE public.car_race_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_image_key TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('start', 'victory', 'defeat', 'collision')),
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(car_image_key, video_type)
);

ALTER TABLE public.car_race_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Car race videos readable by all"
ON public.car_race_videos FOR SELECT
USING (true);

CREATE POLICY "Admins can insert car race videos"
ON public.car_race_videos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update car race videos"
ON public.car_race_videos FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete car race videos"
ON public.car_race_videos FOR DELETE
USING (has_role(auth.uid(), 'admin'));