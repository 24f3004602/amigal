'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useTurnServers } from './useTurnServers';

// ==================== MEDIA CONSTRAINTS ====================
const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    frameRate: { ideal: 30, min: 15 },
    facingMode: 'user',
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 2,
  },
};

// ==================== TYPES ====================
export interface ConnectionQuality {
  bitrate: number;
  packetLoss: number;
  latency: number;
  fps: number;
  resolution: string;
  state: RTCPeerConnectionState;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  quality: ConnectionQuality;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  turnLoading: boolean;
  setupPeerConnection: (isInitiator: boolean) => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  switchCamera: (deviceId: string) => Promise<void>;
  switchMicrophone: (deviceId: string) => Promise<void>;
  togglePictureInPicture: (videoElement: HTMLVideoElement) => Promise<void>;
  endCall: () => void;
}

export function useWebRTC(
  roomId: string,
  mode: 'text' | 'video',
  socket: any,
  preferredDeviceId?: { video?: string; audio?: string }
): UseWebRTCReturn {
  const { toast } = useToast();
  const { iceServers, loading: turnLoading } = useTurnServers();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const statsIntervalRef = useRef<NodeJS.Timeout>();
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const politeRef = useRef(false);
  const isCleaningUp = useRef(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [quality, setQuality] = useState<ConnectionQuality>({
    bitrate: 0,
    packetLoss: 0,
    latency: 0,
    fps: 0,
    resolution: '',
    state: 'new',
  });

  // ==================== CLEANUP ====================
  const cleanup = useCallback(() => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);

    localStreamRef.current?.getTracks().forEach((t) => {
      t.stop();
    });
    screenStream?.getTracks().forEach((t) => t.stop());

    pcRef.current?.getSenders().forEach((sender) => {
      if (sender.track) sender.replaceTrack(null);
    });
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('closed');
    setIsScreenSharing(false);
    setScreenStream(null);

    isCleaningUp.current = false;
  }, [screenStream]);

  // ==================== STATS MONITORING ====================
  const startStatsMonitoring = useCallback(() => {
    if (!pcRef.current) return;

    statsIntervalRef.current = setInterval(async () => {
      if (!pcRef.current) return;
      try {
        const stats = await pcRef.current.getStats();
        let bitrate = 0;
        let packetsLost = 0;
        let packetsReceived = 0;
        let fps = 0;
        let width = 0;
        let height = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            if (report.bytesReceived) {
              bitrate = (report.bytesReceived * 8) / 1000;
            }
            if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
              packetsLost = report.packetsLost;
              packetsReceived = report.packetsReceived;
            }
            if (report.framesPerSecond) fps = report.framesPerSecond;
          }
          if (report.type === 'track' && report.kind === 'video') {
            width = report.frameWidth || 0;
            height = report.frameHeight || 0;
          }
        });

        const packetLossPercent = packetsReceived > 0 ? (packetsLost / (packetsLost + packetsReceived)) * 100 : 0;

        setQuality({
          bitrate: Math.round(bitrate),
          packetLoss: Math.round(packetLossPercent * 100) / 100,
          latency: 0,
          fps,
          resolution: width && height ? `${width}x${height}` : '',
          state: pcRef.current.connectionState,
        });
      } catch {
        // Silently ignore stats errors
      }
    }, 2000);
  }, []);

  // ==================== GET LOCAL MEDIA ====================
  const getLocalMedia = useCallback(async () => {
    if (mode === 'text') return null;

    try {
      const constraints: MediaStreamConstraints = {
        ...MEDIA_CONSTRAINTS,
        video: preferredDeviceId?.video
          ? { ...(MEDIA_CONSTRAINTS.video as object), deviceId: { exact: preferredDeviceId.video } }
          : MEDIA_CONSTRAINTS.video,
        audio: preferredDeviceId?.audio
          ? { ...(MEDIA_CONSTRAINTS.audio as object), deviceId: { exact: preferredDeviceId.audio } }
          : MEDIA_CONSTRAINTS.audio,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      toast.error(`Camera/Mic access denied: ${err.message}`);
      throw err;
    }
  }, [preferredDeviceId, mode, toast]);

  // ==================== ICE RESTART ====================
  const handleIceRestart = useCallback(async () => {
    if (!pcRef.current || pcRef.current.signalingState === 'closed') return;
    try {
      const offer = await pcRef.current.createOffer({ iceRestart: true });
      await pcRef.current.setLocalDescription(offer);
      socket?.emit('offer', { roomId, offer });
      toast.info('Attempting to reconnect...');
    } catch (err) {
      console.error('ICE restart failed:', err);
      toast.error('Connection failed. Please rejoin.');
    }
  }, [roomId, socket, toast]);

  // ==================== CREATE PEER CONNECTION ====================
  const createPeerConnection = useCallback(() => {
    if (iceServers.length === 0) {
      throw new Error('TURN servers not loaded yet');
    }

    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    pcRef.current = pc;

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);

      if (state === 'failed') {
        toast.error('Connection failed. Attempting to reconnect...');
        handleIceRestart();
      }
      if (state === 'disconnected') {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            toast.error('Connection lost. Reconnecting...');
            handleIceRestart();
          }
        }, 5000);
      }
      if (state === 'connected') {
        toast.success('Connected');
      }
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription(await pc.createOffer());
        socket?.emit('offer', { roomId, offer: pc.localDescription });
      } catch (err) {
        console.error('Negotiation error:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    pc.ondtlserror = () => {
      toast.error('Secure connection error');
      endCall();
    };

    return pc;
  }, [iceServers, roomId, socket, toast, handleIceRestart]);

  // ==================== SETUP (INITIATOR) ====================
  const setupPeerConnection = useCallback(
    async (isInitiator: boolean) => {
      if (turnLoading) {
        toast.info('Loading TURN servers...');
        return;
      }

      politeRef.current = isInitiator;

      try {
        cleanup();
        const pc = createPeerConnection();
        const stream = await getLocalMedia();

        if (stream) {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        }

        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket?.emit('offer', { roomId, offer });
        }

        startStatsMonitoring();

        // Socket event handlers
        socket?.on('offer', async (msg: any) => {
          const readyForOffer = !makingOfferRef.current && (pc.signalingState === 'stable' || politeRef.current);
          ignoreOfferRef.current = !readyForOffer && !politeRef.current;

          if (ignoreOfferRef.current) return;

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId, answer });
          } catch (err) {
            console.error('Offer handling error:', err);
          }
        });

        socket?.on('answer', async (msg: any) => {
          try {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
            }
          } catch (err) {
            console.error('Answer handling error:', err);
          }
        });

        socket?.on('ice-candidate', async (msg: any) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {
            if (!ignoreOfferRef.current) console.error('ICE candidate error:', e);
          }
        });

        socket?.on('peer-joined', () => {
          toast.success('Peer joined the room');
        });

        return pc;
      } catch (err) {
        console.error('Setup failed:', err);
        throw err;
      }
    },
    [cleanup, createPeerConnection, getLocalMedia, roomId, socket, startStatsMonitoring, toast, turnLoading]
  );

  // ==================== DEVICE SWITCHING ====================
  const switchCamera = useCallback(
    async (deviceId: string) => {
      if (!pcRef.current || !localStreamRef.current) return;
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });
        const newTrack = newStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(newTrack);

        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
        localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
        localStreamRef.current.addTrack(newTrack);

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      } catch (err) {
        toast.error('Failed to switch camera');
      }
    },
    [toast]
  );

  const switchMicrophone = useCallback(
    async (deviceId: string) => {
      if (!pcRef.current || !localStreamRef.current) return;
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { deviceId: { exact: deviceId } },
        });
        const newTrack = newStream.getAudioTracks()[0];
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'audio');
        if (sender) await sender.replaceTrack(newTrack);

        localStreamRef.current.getAudioTracks().forEach((t) => t.stop());
        localStreamRef.current.removeTrack(localStreamRef.current.getAudioTracks()[0]);
        localStreamRef.current.addTrack(newTrack);

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      } catch (err) {
        toast.error('Failed to switch microphone');
      }
    },
    [toast]
  );

  // ==================== SCREEN SHARING ====================
  const startScreenShare = useCallback(async () => {
    if (!pcRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' as const, displaySurface: 'monitor' as const },
        audio: false,
      });

      const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
      const originalTrack = localStreamRef.current?.getVideoTracks()[0];

      if (videoSender && stream.getVideoTracks()[0]) {
        await videoSender.replaceTrack(stream.getVideoTracks()[0]);
      }

      setScreenStream(stream);
      setIsScreenSharing(true);

      stream.getVideoTracks()[0].onended = async () => {
        if (originalTrack && videoSender) {
          await videoSender.replaceTrack(originalTrack);
        }
        setIsScreenSharing(false);
        setScreenStream(null);
      };
    } catch (err) {
      toast.error('Screen sharing failed');
    }
  }, [toast]);

  const stopScreenShare = useCallback(async () => {
    if (!pcRef.current || !screenStream) return;
    const videoSender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
    const originalTrack = localStreamRef.current?.getVideoTracks()[0];

    if (originalTrack && videoSender) {
      await videoSender.replaceTrack(originalTrack);
    }
    screenStream.getTracks().forEach((t) => t.stop());
    setIsScreenSharing(false);
    setScreenStream(null);
  }, [screenStream]);

  // ==================== MUTE / VIDEO TOGGLE ====================
  const toggleMute = useCallback(() => {
    const enabled = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setIsMuted(!enabled);
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    const enabled = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    setIsVideoOff(!enabled);
  }, [isVideoOff]);

  // ==================== PICTURE-IN-PICTURE ====================
  const togglePictureInPicture = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoElement) {
        await videoElement.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed:', err);
    }
  }, []);

  // ==================== END CALL ====================
  const endCall = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // ==================== LIFECYCLE ====================
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Re-setup when iceServers change (e.g., after TURN credentials load)
  useEffect(() => {
    if (!turnLoading && iceServers.length > 0 && roomId && socket) {
      // Only auto-setup if we haven't already
      if (!pcRef.current && mode === 'video') {
        setupPeerConnection(true);
      }
    }
  }, [turnLoading, iceServers, roomId, socket, mode, setupPeerConnection]);

  return {
    localStream,
    remoteStream,
    connectionState,
    iceConnectionState,
    quality,
    isMuted,
    isVideoOff,
    isScreenSharing,
    turnLoading,
    setupPeerConnection,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    switchMicrophone,
    togglePictureInPicture,
    endCall,
  };
}
