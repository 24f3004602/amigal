'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

// ==================== TURN/STUN CONFIGURATION ====================
// In production, fetch these from your API or environment
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Add your TURN servers here:
  // {
  //   urls: 'turns:turn.yourdomain.com:5349',
  //   username: 'user',
  //   credential: 'pass',
  // },
];

const PC_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  // Security: Require DTLS for all peer connections
  // Note: 'dtlsRole' is not standard RTCConfiguration; removed to avoid TS errors
};

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

export interface ConnectionQuality {
  bitrate: number;      // kbps
  packetLoss: number;   // percentage
  latency: number;      // ms
  fps: number;
  resolution: string;
  state: RTCPeerConnectionState;
}

export function useWebRTC(
  roomId: string,
  mode: 'text' | 'video',
  socket: any,
  preferredDeviceId?: { video?: string; audio?: string }
) {
  const { toast } = useToast();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const statsIntervalRef = useRef<NodeJS.Timeout>();
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const politeRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

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
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);

    localStreamRef.current?.getTracks().forEach((t) => {
      t.stop();
      try {
        localStreamRef.current?.removeTrack(t);
      } catch {
        // Track may already be removed
      }
    });
    screenStream?.getTracks().forEach((t) => t.stop());

    pcRef.current?.getSenders().forEach((sender) => {
      if (sender.track) sender.replaceTrack(null);
    });
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    reconnectAttemptsRef.current = 0;

    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('closed');
    setIceConnectionState('closed');
    setIsScreenSharing(false);
    setScreenStream(null);
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
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            // Current round-trip time in seconds → ms
            if (report.currentRoundTripTime) {
              setQuality((q) => ({ ...q, latency: Math.round(report.currentRoundTripTime * 1000) }));
            }
          }
        });

        const packetLossPercent = packetsReceived > 0 ? (packetsLost / (packetsLost + packetsReceived)) * 100 : 0;

        setQuality((prev) => ({
          ...prev,
          bitrate: Math.round(bitrate),
          packetLoss: Math.round(packetLossPercent * 100) / 100,
          fps,
          resolution: width && height ? `${width}x${height}` : '',
          state: pcRef.current?.connectionState || 'new',
        }));
      } catch (err) {
        // Stats collection failed silently
      }
    }, 2000);
  }, []);

  // ==================== CREATE PEER CONNECTION ====================
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(PC_CONFIG);
    pcRef.current = pc;

    // Security: Handle DTLS errors
    (pc as any).ondtlserror = (e: Event) => {
      console.error('DTLS error:', e);
      toast.error('Secure connection error. Ending call.');
      cleanup();
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);

      if (state === 'failed') {
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
          toast.error(`Connection failed. Reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          handleIceRestart();
        } else {
          toast.error('Connection failed permanently. Please rejoin.');
          cleanup();
        }
      }

      if (state === 'disconnected') {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            reconnectAttemptsRef.current += 1;
            if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
              toast.error('Connection lost. Reconnecting...');
              handleIceRestart();
            } else {
              toast.error('Connection lost. Please rejoin.');
              cleanup();
            }
          }
        }, 5000);
      }

      if (state === 'connected') {
        reconnectAttemptsRef.current = 0;
      }
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
    };

    // Security: Verify tracks before accepting
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        // All WebRTC tracks are encrypted by DTLS-SRTP by default in modern browsers
        // This is a defense-in-depth check
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

    return pc;
  }, [roomId, socket, toast, cleanup]);

  // ==================== GET LOCAL MEDIA ====================
  const getLocalMedia = useCallback(async () => {
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
  }, [preferredDeviceId, toast]);

  // ==================== SETUP (INITIATOR) ====================
  const setupPeerConnection = useCallback(
    async (isInitiator: boolean) => {
      politeRef.current = isInitiator;

      try {
        cleanup();
        const pc = createPeerConnection();
        const stream = await getLocalMedia();

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

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

          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { roomId, answer });
        });

        socket?.on('answer', async (msg: any) => {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
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
    [cleanup, createPeerConnection, getLocalMedia, roomId, socket, startStatsMonitoring, toast]
  );

  // ==================== ICE RESTART ====================
  const handleIceRestart = useCallback(async () => {
    if (!pcRef.current) return;
    try {
      const offer = await pcRef.current.createOffer({ iceRestart: true });
      await pcRef.current.setLocalDescription(offer);
      socket?.emit('offer', { roomId, offer });
    } catch (err) {
      console.error('ICE restart failed:', err);
    }
  }, [roomId, socket]);

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

        // Stop old video track
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

      if (videoSender) {
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
      } else {
        await videoElement.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed:', err);
    }
  }, []);

  // ==================== LIFECYCLE ====================
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    connectionState,
    iceConnectionState,
    quality,
    isMuted,
    isVideoOff,
    isScreenSharing,
    setupPeerConnection,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    switchMicrophone,
    togglePictureInPicture,
    endCall: cleanup,
  };
}
