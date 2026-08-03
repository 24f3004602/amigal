    await subscriber.subscribe(channel);
    subscriber.on('message', handler);

    // Store subscriber on socket for cleanup
    (client as any).__subscriber = subscriber;
    (client as any).__handler = handler;

    this.logger.info(`Client connected: ${client.user.userId}`);
  }

  async handleDisconnect(client: AuthSocket) {
    const subscriber = (client as any).__subscriber;
    const handler = (client as any).__handler;
    const channel = `user:${client.user?.userId}:match`;

    if (subscriber && handler) {
      subscriber.off('message', handler);
      await subscriber.unsubscribe(channel);
      subscriber.disconnect();
    }

    this.logger.info(`Client disconnected: ${client.user?.userId}`);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(client: AuthSocket, payload: { roomId: string }) {
    if (!client.user) return;

    const session = await this.prisma.session.findFirst({
      where: {
        roomId: payload.roomId,
        OR: [
          { userAId: client.user.userId },
          { userBId: client.user.userId },
        ],
        endedAt: null,
      },
    });

    if (!session) {
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Not authorized for this room' });
      return;
    }

    client.join(payload.roomId);
    client.to(payload.roomId).emit('peer-joined', { userId: client.user.userId });
    this.logger.info(`User ${client.user.userId} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('offer')
  handleOffer(client: AuthSocket, payload: { roomId: string; offer: RTCSessionDescriptionInit }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('offer', {
      offer: payload.offer,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: AuthSocket, payload: { roomId: string; answer: RTCSessionDescriptionInit }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('answer', {
      answer: payload.answer,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(client: AuthSocket, payload: { roomId: string; candidate: RTCIceCandidateInit }) {
    if (!client.user) return;
    client.to(payload.roomId).emit('ice-candidate', {
      candidate: payload.candidate,
      senderId: client.user.userId,
    });
  }

  @SubscribeMessage('end-call')
  async handleEndCall(client: AuthSocket, payload: { roomId: string }) {
    if (!client.user) return;

    await this.prisma.session.updateMany({
      where: { roomId: payload.roomId },
      data: {
        endedAt: new Date(),
        terminationReason: 'normal',
      },
    });

    this.server.to(payload.roomId).emit('call-ended', { endedBy: client.user.userId });
    this.server.in(payload.roomId).socketsLeave(payload.roomId);
    this.logger.info(`Call ended in room ${payload.roomId} by ${client.user.userId}`);
  }
}
