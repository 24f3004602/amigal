'use client';

import { useState, useCallback } from 'react';
import { useTurnServers } from '@/hooks/useTurnServers';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function TurnTest() {
  const { iceServers, loading, refetch } = useTurnServers();
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const testConnectivity = useCallback(async () => {
    setTesting(true);
    setResults([]);

    const pc = new RTCPeerConnection({ iceServers });
    const dc = pc.createDataChannel('test');

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;

      const type = e.candidate.candidate.includes('typ relay')
        ? '✅ TURN (relay)'
        : e.candidate.candidate.includes('typ srflx')
        ? '🟡 STUN (server reflexive)'
        : '⚪ Host';

      setResults((prev) => [...prev, `${type}: ${e.candidate.address}:${e.candidate.port}`]);
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        setTesting(false);
        pc.close();
      }
    };

    // Create offer to trigger ICE gathering
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Timeout after 10s
    setTimeout(() => {
      setTesting(false);
      pc.close();
    }, 10000);
  }, [iceServers]);

  return (
    <div className="glass-card p-6 space-y-4 max-w-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">TURN Server Test</h3>
        <Badge variant={loading ? 'warning' : 'success'}>
          {loading ? 'Loading...' : 'Ready'}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">ICE Servers configured:</p>
        <ul className="space-y-1">
          {iceServers.map((s, i) => (
            <li key={i} className="font-mono text-xs bg-muted p-2 rounded">
              {JSON.stringify(s, null, 2)}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button onClick={testConnectivity} disabled={testing || loading} className="gap-2">
          {testing ? 'Testing...' : 'Test Connectivity'}
        </Button>
        <Button variant="secondary" onClick={refetch} disabled={loading}>
          Refresh Credentials
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Candidates found:</p>
          {results.map((r, i) => (
            <p key={i} className="text-xs font-mono text-muted-foreground">
              {r}
            </p>
          ))}
        </div>
      )}

      {results.length === 0 && !testing && (
        <p className="text-xs text-muted-foreground">
          Click "Test Connectivity" to verify TURN relay is working.
          Look for ✅ TURN (relay) candidates — these mean symmetric NAT users can connect.
        </p>
      )}
    </div>
  );
}
