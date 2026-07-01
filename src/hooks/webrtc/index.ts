/**
 * WebRTC Hook System
 * 
 * This module exports the refactored WebRTC hooks:
 * - useMediaCapture: Local media capture and management
 * - usePeerConnection: RTCPeerConnection creation and management
 * - useICECandidateQueue: ICE candidate queueing and application
 * - useCallLifecycle: Call lifecycle management (create, answer, end)
 * - useAutoplayRecovery: Browser autoplay policy handling
 * - useCallTelemetry: Call health monitoring and metrics
 * - useWebRTC: Main orchestrator hook (backwards compatible)
 */

export * from './types';
export * from './useMediaCapture';
export * from './usePeerConnection';
export * from './useICECandidateQueue';
export * from './useCallLifecycle';
export * from './useAutoplayRecovery';
export * from './useCallTelemetry';

// Re-export the main hook for backwards compatibility
// This is imported from the parent directory's useWebRTC.tsx
