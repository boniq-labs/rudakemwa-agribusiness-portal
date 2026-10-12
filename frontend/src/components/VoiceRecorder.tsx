import { useState, useEffect, useRef, useCallback } from 'react';
import { MicOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { voiceRecordingAPI } from '../api/endpoints';

type RecordingState = 
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'waiting_for_ids'
  | 'uploading'
  | 'saved'
  | 'failed'
  | 'unsupported'
  | 'permission_denied';

interface VoiceRecorderProps {
  /** Optional: pre-known IDs (available after sale creation) */
  salesOrderId?: number;
  customerId?: number;
  onSaved?: (recording: any) => void;
  /** When true, triggers the 3-second grace period stop sequence */
  shouldStop?: boolean;
  /** Called when recording is stopped and ready to upload, but needs IDs.
   * Provide the upload function to the parent so it can be called with the correct IDs. */
  onReadyToUpload?: (recorder: { 
    upload: (ids: { salesOrderId?: number; customerId?: number }) => Promise<void>;
    cancel: () => void;
  }) => void;
}

const VOICE_RECORDING_STOP_DELAY_MS = 3000;
const MAX_RECORDING_DURATION_MS = 10 * 60 * 1000; // 10 minutes max

export default function VoiceRecorder({
  salesOrderId,
  customerId,
  onSaved,
  shouldStop,
  onReadyToUpload,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);
  const isStoppingRef = useRef(false);
  const hasStartedRef = useRef(false);
  const isUploadingRef = useRef(false);
  // Store recorded data for delayed upload
  const recordedBlobRef = useRef<Blob | null>(null);
  const recordedDurationRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
    recordingStartTimeRef.current = 0;
    isStoppingRef.current = false;
    isUploadingRef.current = false;
  }, []);

  const handleRecordingStopped = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Create blob from recorded chunks
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
    const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
    
    // Store for later upload
    recordedBlobRef.current = blob;
    recordedDurationRef.current = duration;
    
    // Stop the duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    
    // If IDs are already available, upload immediately
    if (salesOrderId || customerId) {
      const ids = { salesOrderId, customerId };
      uploadWithIds(ids);
    } else {
      // Wait for IDs - notify parent
      setState('waiting_for_ids');
      onReadyToUpload?.({
        upload: uploadWithIds,
        cancel: () => {
          if (isMountedRef.current) {
            recordedBlobRef.current = null;
            recordedDurationRef.current = 0;
            setState('idle');
          }
        }
      });
    }
  }, [salesOrderId, customerId, onReadyToUpload]);

  const uploadWithIds = useCallback(async (ids: { salesOrderId?: number; customerId?: number }) => {
    if (!isMountedRef.current || !recordedBlobRef.current) return;
    
    isUploadingRef.current = true;
    setState('uploading');

    try {
      const blob = recordedBlobRef.current;

      const formData = new FormData();
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append('audio', file);
      formData.append('duration_seconds', recordedDurationRef.current.toString());
      if (ids.salesOrderId) formData.append('sales_order_id', ids.salesOrderId.toString());
      if (ids.customerId) formData.append('customer_id', ids.customerId.toString());

      const data = await voiceRecordingAPI.create(formData);

      setState('saved');
      onSaved?.(data.data);
      setAudioUrl(data.data.file_url);
      setDuration(data.data.duration_seconds || recordedDurationRef.current);
    } catch (err: any) {
      console.error('Voice recording upload failed:', err);
      setState('failed');
      setErrorMessage(err.message || 'Failed to save recording');
      // Don't call onError for upload failures - the sale should continue
    } finally {
      if (isMountedRef.current) {
        isUploadingRef.current = false;
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setState('unsupported');
      return;
    }

    setState('requesting_permission');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (isMountedRef.current && !isStoppingRef.current) {
          handleRecordingStopped();
        }
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        if (isMountedRef.current) {
          setState('failed');
          setErrorMessage('Recording failed');
        }
      };

      recorder.start(100); // collect data every 100ms
      recordingStartTimeRef.current = Date.now();
      setState('recording');
      setDuration(0);

      // Duration timer for UI display
      durationTimerRef.current = setInterval(() => {
        if (isMountedRef.current && recordingStartTimeRef.current > 0) {
          setDuration(Math.round((Date.now() - recordingStartTimeRef.current) / 1000));
        }
      }, 500);

      // Safety: auto-stop after max duration
      setTimeout(() => {
        if (isMountedRef.current && mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, MAX_RECORDING_DURATION_MS);

    } catch (err: any) {
      console.error('Failed to start recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setState('permission_denied');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setState('unsupported');
      } else {
        setState('failed');
        setErrorMessage(err.message || 'Failed to start recording');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
    isStoppingRef.current = true;
    setState('stopping');

    // Wait 3 seconds before actually stopping to capture trailing conversation
    stopTimerRef.current = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, VOICE_RECORDING_STOP_DELAY_MS);
  }, []);

  // Auto-start recording when component mounts with a valid context
  useEffect(() => {
    isMountedRef.current = true;
    hasStartedRef.current = false;
    isStoppingRef.current = false;
    isUploadingRef.current = false;

    // Auto-start when we have a valid sales context
    if (salesOrderId !== undefined || customerId !== undefined) {
      startRecording();
    }

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [salesOrderId, customerId, startRecording, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Handle navigation away while recording
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        stopRecording();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stopRecording]);

  // Handle external stop trigger (e.g., sale completed)
  useEffect(() => {
    if (shouldStop && mediaRecorderRef.current?.state === 'recording') {
      stopRecording();
    }
  }, [shouldStop, stopRecording]);

  // Render based on state
  const getStatusDisplay = () => {
    switch (state) {
      case 'idle':
        return null;
      case 'requesting_permission':
        return (
          <div className="voice-recorder-status requesting">
            <span className="spinner" style={{ animation: 'spin 1s linear infinite' }}></span>
            <span>Requesting microphone access...</span>
          </div>
        );
      case 'recording':
        return (
          <div className="voice-recorder-status recording">
            <div className="recording-indicator">
              <span className="pulse-dot"></span>
              <span>Recording...</span>
              <span className="duration">{formatDuration(duration)}</span>
            </div>
          </div>
        );
      case 'stopping':
        return (
          <div className="voice-recorder-status stopping">
            <span className="spinner" style={{ animation: 'spin 1s linear infinite' }}></span>
            <span>Finalizing recording...</span>
          </div>
        );
      case 'uploading':
        return (
          <div className="voice-recorder-status uploading">
            <span className="spinner" style={{ animation: 'spin 1s linear infinite' }}></span>
            <span>Saving recording...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="voice-recorder-status saved">
            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
            <span>Voice recording saved</span>
            {audioUrl && (
              <audio controls src={audioUrl} style={{ marginLeft: 12, maxWidth: 200 }} />
            )}
          </div>
        );
      case 'failed':
        return (
          <div className="voice-recorder-status failed">
            <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />
            <span>Recording failed: {errorMessage}</span>
          </div>
        );
      case 'unsupported':
        return (
          <div className="voice-recorder-status unsupported">
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <span>Voice recording not supported in this browser</span>
          </div>
        );
      case 'permission_denied':
        return (
          <div className="voice-recorder-status permission_denied">
            <MicOff size={16} style={{ color: 'var(--warning)' }} />
            <span>Microphone access denied. Sale continues normally.</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="voice-recorder" style={{ 
      padding: '8px 12px', 
      borderRadius: '8px', 
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      marginTop: '8px',
      minHeight: '40px',
    }}>
      {getStatusDisplay()}
      {/* @ts-ignore */}
      <style jsx={true} key="voice-recorder-styles">{`
        .voice-recorder-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .voice-recorder-status.recording {
          color: var(--danger);
        }
        .voice-recorder-status.recording .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--danger);
          animation: pulse 1s infinite;
        }
        .voice-recorder-status .duration {
          font-variant-numeric: tabular-nums;
          font-family: monospace;
        }
        .voice-recorder-status .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        audio {
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}