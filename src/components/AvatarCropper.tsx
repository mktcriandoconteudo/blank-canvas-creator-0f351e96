import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Check, X } from "lucide-react";

interface AvatarCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    256,
    256
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
  });
}

const AvatarCropper = ({ imageSrc, onCropComplete, onCancel }: AvatarCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((_: unknown, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropComplete(blob);
  }, [croppedAreaPixels, imageSrc, onCropComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl border border-border/30 bg-card/90 backdrop-blur-xl overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border/10">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Ajustar Avatar
          </h3>
          <p className="font-body text-[11px] text-muted-foreground mt-0.5">
            Arraste e use o zoom para enquadrar sua foto
          </p>
        </div>

        <div className="relative h-72 w-full bg-background">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropChange}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-border/10">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-muted/30 accent-primary"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 py-3 border-t border-border/10">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 h-10 font-display text-xs uppercase tracking-wider"
          >
            <X className="mr-1.5 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 h-10 bg-primary text-primary-foreground font-display text-xs uppercase tracking-wider"
          >
            <Check className="mr-1.5 h-4 w-4" />
            Confirmar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AvatarCropper;
