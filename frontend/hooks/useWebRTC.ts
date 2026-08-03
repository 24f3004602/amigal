'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from './useChatStore';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC(roomId: string, mode: 'text' | 'video', socket: Socket | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const { addMessage, setTyping } = useChatStore();

  const setupDataChannel = (channel: RTCDataChannel) => {
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat') {
        addMessage({
          id: crypto.randomUUID(),
          text: data.text,
          sender: 'partner',
          timestamp: Date.now(),
        });
      }
      if (data.type === 'typing') {
        setTyping(data.isTyping);
      }
    };
  };

  const setupPeerConnection = useCallback(
    async (isInitiator: boolean) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      if (mode === 'video') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          setLocalStream(stream);
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        } catch (err) {
          console.error('Failed to get media:', err);
        }
      }

      if (isInitiator) {
        const channel = pc.createDataChannel('chat', { ordered: true });
        setupDataChannel(channel);
      }

      if (socket) {
        socket.on('offer', async (msg: any) => {
          if (!isInitiator) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId, answer });
          }
        });

        socket.on('answer', async (msg: any) => {
          if (isInitiator) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          }
        });

        socket.on('ice-candidate', async (msg: any) => {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {}
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice-candidate', { roomId, candidate: event.candidate });
        }
      };

      if (isInitiator && socket) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { roomId, offer });
      }

      return pc;
    },
    [roomId, mode, socket]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (channelRef.current?.readyState === 'open') {
        channelRef.current.send(JSON.stringify({ type: 'chat', text }));
      }
      addMessage({
        id: crypto.randomUUID(),
        text,
        sender: 'me',
        timestamp: Date.now(),
      });
    },
    [addMessage]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (channelRef.current?.readyState === 'open') {
        channelRef.current.send(JSON.stringify({ type: 'typing', isTyping }));
      }
    },
    []
  );

  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
  }, [localStream]);

  const endCall = useCallback(() => {
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
  }, [localStream]);

  useEffect(() => {
    return () => endCall();
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    connectionState,
    setupPeerConnection,
    sendMessage,
    sendTyping,
    toggleMute,
    toggleVideo,
    endCall,
  };
}
