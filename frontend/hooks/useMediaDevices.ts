'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

interface UseMediaDevicesReturn {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
  selectedCamera: string;
  selectedMicrophone: string;
  selectedSpeaker: string;
  setSelectedCamera: (id: string) => void;
  setSelectedMicrophone: (id: string) => void;
  setSelectedSpeaker: (id: string) => void;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
  enumerate: () => Promise<void>;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const hasEnumerated = useRef(false);

  const enumerate = useCallback(async () => {
    try {
      // Request permission first to get labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionStatus('granted');

      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}`, kind: d.kind as 'videoinput' }));
      
      const mics = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`, kind: d.kind as 'audioinput' }));
      
      const spks = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`, kind: d.kind as 'audiooutput' }));

      setCameras(cams);
      setMicrophones(mics);
      setSpeakers(spks);

      if (!selectedCamera && cams.length) setSelectedCamera(cams[0].deviceId);
      if (!selectedMicrophone && mics.length) setSelectedMicrophone(mics[0].deviceId);
      if (!selectedSpeaker && spks.length) setSelectedSpeaker(spks[0].deviceId);
    } catch (err) {
      console.error('Device enumeration failed:', err);
      setPermissionStatus('denied');
    }
  }, [selectedCamera, selectedMicrophone, selectedSpeaker]);

  useEffect(() => {
    if (hasEnumerated.current) return;
    hasEnumerated.current = true;
    enumerate();
  }, [enumerate]);

  // Listen for device changes (plug/unplug)
  useEffect(() => {
    const handler = () => enumerate();
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
  }, [enumerate]);

  return {
    cameras,
    microphones,
    speakers,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
    permissionStatus,
    enumerate,
  };
}
