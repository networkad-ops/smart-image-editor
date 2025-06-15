import { useState } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { motion } from 'framer-motion';
import { Format, CropData } from '../types';

interface ImageCropperProps {
  imageUrl: string;
  format: Format;
  onCropComplete: (cropData: CropData) => void;
}

export function ImageCropper({ imageUrl, format, onCropComplete }: ImageCropperProps) {
  const [cropper, setCropper] = useState<Cropper>();

  const handleCrop = () => {
    if (!cropper) return;

    const cropData = cropper.getData();
    onCropComplete({
      x: cropData.x,
      y: cropData.y,
      width: cropData.width,
      height: cropData.height
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="relative aspect-[16/9] bg-gray-100 rounded-card overflow-hidden">
        <Cropper
          src={imageUrl}
          style={{ height: '100%', width: '100%' }}
          aspectRatio={format.width / format.height}
          guides={true}
          onInitialized={(instance) => setCropper(instance)}
          viewMode={2}
          autoCropArea={1}
          background={false}
          responsive={true}
          restore={false}
          center={true}
          highlight={false}
          cropBoxMovable={true}
          cropBoxResizable={true}
          toggleDragModeOnDblclick={false}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCrop}
          className="px-6 py-2 bg-primary text-white rounded-button hover:bg-primary/90 transition-colors"
        >
          Apply Crop
        </button>
      </div>

      <div className="text-sm text-gray-500">
        <p>Drag to move the crop area</p>
        <p>Use the handles to resize</p>
        <p>Target size: {format.width} x {format.height} pixels</p>
      </div>
    </motion.div>
  );
} 