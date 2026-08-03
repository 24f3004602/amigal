'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { Video, Mic, Speaker, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceSelectorProps {
  open: boolean;
  onClose: () => void;
  onApply: (devices: { video: string; audio: string; speaker: string }) => void;
}

export function DeviceSelector({ open, onClose, onApply }: DeviceSelectorProps) {
  const {
    cameras,
    microphones,
    speakers,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
  } = useMediaDevices();

  const [previewVideo, setPreviewVideo] = useState<string>(selectedCamera);
  const [previewAudio, setPreviewAudio] = useState<string>(selectedMicrophone);
  const [previewSpeaker, setPreviewSpeaker] = useState<string>(selectedSpeaker);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md rounded-2xl p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Device Settings</h2>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Camera */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4 text-primary" /> Camera
              </label>
              <div className="space-y-1">
                {cameras.map((cam) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => setPreviewVideo(cam.deviceId)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      previewVideo === cam.deviceId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {previewVideo === cam.deviceId && <Check className="h-3.5 w-3.5" />}
                    {cam.label}
                  </button>
                ))}
                {cameras.length === 0 && (
                  <p className="text-sm text-muted-foreground px-3">No cameras found</p>
                )}
              </div>
            </div>

            {/* Microphone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Mic className="h-4 w-4 text-primary" /> Microphone
              </label>
              <div className="space-y-1">
                {microphones.map((mic) => (
                  <button
                    key={mic.deviceId}
                    onClick={() => setPreviewAudio(mic.deviceId)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      previewAudio === mic.deviceId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {previewAudio === mic.deviceId && <Check className="h-3.5 w-3.5" />}
                    {mic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speaker */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Speaker className="h-4 w-4 text-primary" /> Speaker
              </label>
              <div className="space-y-1">
                {speakers.map((spk) => (
                  <button
                    key={spk.deviceId}
                    onClick={() => setPreviewSpeaker(spk.deviceId)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      previewSpeaker === spk.deviceId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {previewSpeaker === spk.deviceId && <Check className="h-3.5 w-3.5" />}
                    {spk.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  onApply({ video: previewVideo, audio: previewAudio, speaker: previewSpeaker });
                  onClose();
                }}
              >
                Apply
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
