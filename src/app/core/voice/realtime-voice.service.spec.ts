import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyProjectFormState } from '../models/project-form.model';
import { RealtimeVoiceService } from './realtime-voice.service';

/**
 * Covers the two paths that don't need a real WebRTC handshake — support
 * detection and permission denial (frontend CLAUDE.md § Testing: "permission
 * denial and missing-API paths are tested explicitly, not assumed"). The
 * connected path (SDP offer/answer, data channel events) needs a much
 * heavier WebRTC mock than is justified here; it's exercised manually and
 * via `curl`/browser testing instead — see the release checklist.
 */
describe('RealtimeVoiceService', () => {
  let originalRTCPeerConnection: unknown;

  beforeEach(() => {
    originalRTCPeerConnection = (globalThis as { RTCPeerConnection?: unknown }).RTCPeerConnection;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    (globalThis as { RTCPeerConnection?: unknown }).RTCPeerConnection = originalRTCPeerConnection;
    vi.restoreAllMocks();
  });

  describe('isSupported', () => {
    it('is false without RTCPeerConnection', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).RTCPeerConnection;
      expect(RealtimeVoiceService.isSupported()).toBe(false);
    });

    it('is true when RTCPeerConnection, a secure context and getUserMedia are all present', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).RTCPeerConnection = class {};
      vi.stubGlobal('isSecureContext', true);
      vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: vi.fn() } });
      expect(RealtimeVoiceService.isSupported()).toBe(true);
    });
  });

  describe('start', () => {
    it('goes to "unsupported" rather than attempting anything when WebRTC is unavailable', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).RTCPeerConnection;
      const service = TestBed.inject(RealtimeVoiceService);

      await service.start(() => emptyProjectFormState(), 'auto');

      expect(service.recorderState()).toBe('unsupported');
    });

    it('degrades to "error" / "permission-denied" when the visitor declines the mic, without touching the network', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).RTCPeerConnection = class {};
      vi.stubGlobal('isSecureContext', true);
      const getUserMedia = vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
      vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } });

      const service = TestBed.inject(RealtimeVoiceService);
      await service.start(() => emptyProjectFormState(), 'auto');

      expect(service.recorderState()).toBe('error');
      expect(service.errorReason()).toBe('permission-denied');
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  describe('stop', () => {
    it('is a no-op that leaves state alone when nothing was ever started', () => {
      const service = TestBed.inject(RealtimeVoiceService);
      expect(() => service.stop()).not.toThrow();
      expect(service.recorderState()).toBe('idle');
    });
  });
});
