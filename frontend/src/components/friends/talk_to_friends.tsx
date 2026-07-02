// pages/talk_to_friends.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../../config/api";
import { socket } from "../../socket";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

interface CallState {
  isCalling: boolean;
  isInCall: boolean;
  callType: "voice" | "video" | null;
  callerId: string | null;
  calleeId: string | null;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  callStatus: "idle" | "dialing" | "ringing" | "connected" | "ended";
}

export default function TalkToFriends() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [callState, setCallState] = useState<CallState>({
    isCalling: false,
    isInCall: false,
    callType: null,
    callerId: null,
    calleeId: null,
    isMuted: false,
    isCameraOn: true,
    isScreenSharing: false,
    isRecording: false,
    callStatus: "idle",
  });
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    fromName: string;
    type: "voice" | "video";
  } | null>(null);
  const [callerName, setCallerName] = useState<string>("");
  const [isCaller, setIsCaller] = useState<boolean>(false);

  // Refs for media
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const isCallEndedRef = useRef<boolean>(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const isReconnectingRef = useRef<boolean>(false);
  const videoSenderRef = useRef<RTCRtpSender | null>(null);
  const blackTrackRef = useRef<MediaStreamTrack | null>(null);

  // ============================================================
  // NEW: Recording Refs (professional canvas-based recording)
  // ============================================================
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingAnimationRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingCanvasReadyRef = useRef<boolean>(false);
  const combinedRecorderStreamRef = useRef<MediaStream | null>(null);

  // Get current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchUsers();

    const handleBeforeUnload = () => {
      if (callState.isInCall || callState.isCalling) {
        if (callState.calleeId) {
          socket.emit("end-call", {
            to: callState.calleeId,
          });
        }
        if (callState.callerId && !isCaller) {
          socket.emit("end-call", {
            to: callState.callerId,
          });
        }
        cleanupCall();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      cleanupCall();
    };
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!currentUser) return;

    socket.emit("user-online", currentUser._id);

    socket.on("user-online", (userId: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isOnline: true } : u
        )
      );
    });

    socket.on("user-offline", (userId: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isOnline: false } : u
        )
      );
    });

    socket.on("incoming-call", (data: { from: string; fromName: string; type: "voice" | "video" }) => {
      setIncomingCall(data);
      setCallerName(data.fromName);
      setCallState((prev) => ({ ...prev, callStatus: "ringing" }));
      setIsCaller(false);
    });

    socket.on("call-accepted", () => {
      setCallState((prev) => ({
        ...prev,
        isInCall: true,
        isCalling: false,
        callStatus: "connected",
      }));
    });

    socket.on("call-rejected", (data?: { from?: string }) => {
      console.log("Call rejected:", data);
      setCallState((prev) => ({
        ...prev,
        isCalling: false,
        callStatus: "idle",
        isInCall: false,
      }));
      cleanupCall();
      alert("Call was rejected by the other user");
    });

    socket.on("call-ended", (data?: { from?: string }) => {
      console.log("Call ended:", data);
      cleanupCall();
      setCallState((prev) => ({
        ...prev,
        callStatus: "idle",
        isCalling: false,
        isInCall: false,
      }));
    });

    // WebRTC signaling
    socket.on("offer", (data) => {
      handleOffer(data);
    });
    socket.on("answer", (data) => {
      handleAnswer(data);
    });
    socket.on("ice-candidate", (data) => {
      handleIceCandidate(data);
    });

    return () => {
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-rejected");
      socket.off("call-ended");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [currentUser]);

  // ---- FIX: Ensure local video is displayed when call UI appears ----
  useEffect(() => {
    if (callState.isInCall && localStreamRef.current && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [callState.isInCall, localStreamRef.current]);

  // ---- FIX: Ensure microphone audio track is enabled when call starts ----
  useEffect(() => {
    if (callState.isInCall && localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        if (!audioTrack.enabled) {
          audioTrack.enabled = true;
          setCallState((prev) => ({ ...prev, isMuted: false }));
          console.log("✅ Audio track enabled on call start");
        }
      } else {
        console.warn("⚠️ No audio track found in local stream");
      }
    }
  }, [callState.isInCall]);

  // ============================================================
  // NEW: Effect to restart recording canvas when streams change
  // ============================================================
  useEffect(() => {
    if (callState.isRecording && recordingCanvasReadyRef.current) {
      // When streams change, the canvas render loop will pick up the changes
      // via the refs. We just need to make sure the canvas is rendering.
      if (!recordingAnimationRef.current) {
        startRecordingRenderLoop();
      }
    }
  }, [callState.isRecording, remoteStreamRef.current, localStreamRef.current, callState.isScreenSharing]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      const storedUser = localStorage.getItem("user");
      const currentUserId = storedUser ? JSON.parse(storedUser)._id : null;
      const filteredUsers = res.data.data.filter((u: User) => u._id !== currentUserId);
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Helper to create a black video track ----
  const createBlackTrack = (): MediaStreamTrack => {
    if (blackTrackRef.current) {
      return blackTrackRef.current.clone();
    }
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];
    blackTrackRef.current = track;
    return track.clone();
  };

  // ============================================================
  // NEW: Recording helper functions
  // ============================================================

  /**
   * Setup the recording canvas with proper dimensions
   */
  const setupRecordingCanvas = useCallback(() => {
    const canvas = recordingCanvasRef.current;
    if (!canvas) return false;

    // Use 16:9 aspect ratio at 1280x720 for good quality
    canvas.width = 1280;
    canvas.height = 720;
    recordingCanvasReadyRef.current = true;

    return true;
  }, []);

  /**
   * Draw a video element onto canvas with proper aspect ratio
   */
  const drawVideoOnCanvas = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement | null,
    x: number,
    y: number,
    w: number,
    h: number,
    borderRadius: number = 0
  ) => {
    if (!video) {
      // Draw placeholder
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, borderRadius);
      ctx.fill();
      ctx.fillStyle = "#666";
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎥", x + w / 2, y + h / 2);
      return;
    }

    // Check if video has data
    if (video.readyState < 2 || video.videoWidth === 0) {
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, borderRadius);
      ctx.fill();
      ctx.fillStyle = "#666";
      ctx.font = "48px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⏳", x + w / 2, y + h / 2);
      return;
    }

    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = w / h;

    let sx = 0,
      sy = 0,
      sw = video.videoWidth,
      sh = video.videoHeight;

    // Crop to fill target aspect ratio (cover)
    if (videoAspect > targetAspect) {
      sw = video.videoHeight * targetAspect;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / targetAspect;
      sy = (video.videoHeight - sh) / 2;
    }

    // Draw with rounded corners if needed
    if (borderRadius > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, borderRadius);
      ctx.clip();
    }

    ctx.drawImage(video, sx, sy, sw, sh, x, y, w, h);

    if (borderRadius > 0) {
      ctx.restore();
    }
  };

  /**
   * Render a single frame of the recording
   */
  const renderRecordingFrame = useCallback(() => {
    const canvas = recordingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;

    // Clear canvas with dark background
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, width, height);

    // Determine layout based on screen sharing state
    const isScreenSharing = callState.isScreenSharing && screenStreamRef.current;

    if (isScreenSharing) {
      // ==========================================================
      // LAYOUT: Screen Share Active
      // Main: Screen Share (full), PIP1: Remote (top-right), PIP2: Local (bottom-right)
      // ==========================================================
      const pipSize = 200;
      const pipGap = 16;
      const borderRadius = 12;

      // Draw screen share as main
      // Use the screen stream video element - we need to render it from the stream
      // Since screenStreamRef.current is a MediaStream, we need a video element to display it
      // We'll use a temporary video element or render directly from the stream
      // For simplicity, we use the remote video element which shows the screen share
      // when screen sharing is active (the screen share is sent to the remote peer
      // and the remote video shows it)
      drawVideoOnCanvas(ctx, remoteVideoRef.current, 0, 0, width, height, 0);

      // Draw "Screen Share" label on main
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, width, 40);
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("🖥️ Screen Share", 16, 22);

      // PIP 1: Remote participant (top-right)
      const pip1X = width - pipSize - pipGap;
      const pip1Y = pipGap;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 20;
      drawVideoOnCanvas(ctx, remoteVideoRef.current, pip1X, pip1Y, pipSize, pipSize * 0.75, borderRadius);
      ctx.shadowBlur = 0;

      // Remote label
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(pip1X + 8, pip1Y + pipSize * 0.75 - 30, 80, 24, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(callerName || "Remote", pip1X + 14, pip1Y + pipSize * 0.75 - 18);

      // PIP 2: Local participant (bottom-right)
      const pip2X = width - pipSize - pipGap;
      const pip2Y = height - pipSize * 0.75 - pipGap;
      drawVideoOnCanvas(ctx, localVideoRef.current, pip2X, pip2Y, pipSize, pipSize * 0.75, borderRadius);

      // Local label with mute indicator
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(pip2X + 8, pip2Y + pipSize * 0.75 - 30, 80, 24, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `You${callState.isMuted ? " 🔇" : ""}${!callState.isCameraOn ? " 📷" : ""}`,
        pip2X + 14,
        pip2Y + pipSize * 0.75 - 18
      );
    } else {
      // ==========================================================
      // LAYOUT: Normal Call
      // Main: Remote participant, PIP: Local participant (bottom-right)
      // ==========================================================
      const pipSize = 220;
      const pipGap = 20;
      const borderRadius = 14;

      // Draw remote as main
      drawVideoOnCanvas(ctx, remoteVideoRef.current, 0, 0, width, height, 0);

      // Remote name label
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, height - 50, 200, 50);
      ctx.fillStyle = "#fff";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`👤 ${callerName || "Remote"}`, 16, height - 25);

      // Recording indicator (red dot)
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(width - 30, 30, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,0,0,0.3)";
      ctx.beginPath();
      ctx.arc(width - 30, 30, 16, 0, Math.PI * 2);
      ctx.fill();

      // PIP: Local participant (bottom-right)
      const pipX = width - pipSize - pipGap;
      const pipY = height - pipSize * 0.75 - pipGap;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 20;
      drawVideoOnCanvas(ctx, localVideoRef.current, pipX, pipY, pipSize, pipSize * 0.75, borderRadius);
      ctx.shadowBlur = 0;

      // Local label with mute/camera indicators
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(pipX + 10, pipY + pipSize * 0.75 - 32, 100, 26, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `You${callState.isMuted ? " 🔇" : ""}${!callState.isCameraOn ? " 📷" : ""}`,
        pipX + 18,
        pipY + pipSize * 0.75 - 19
      );

      // Recording time (top-right)
      const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.roundRect(width - 120, 12, 100, 32, 12);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "14px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⏺ ${mins}:${secs}`, width - 70, 28);
    }
  }, [callState.isScreenSharing, callState.isMuted, callState.isCameraOn, callerName]);

  /**
   * Start the animation loop for canvas rendering
   */
  const startRecordingRenderLoop = useCallback(() => {
    if (recordingAnimationRef.current) {
      cancelAnimationFrame(recordingAnimationRef.current);
      recordingAnimationRef.current = null;
    }

    const loop = () => {
      if (!callState.isRecording) {
        recordingAnimationRef.current = null;
        return;
      }
      renderRecordingFrame();
      recordingAnimationRef.current = requestAnimationFrame(loop);
    };

    recordingAnimationRef.current = requestAnimationFrame(loop);
  }, [callState.isRecording, renderRecordingFrame]);

  /**
   * Setup audio mixing using AudioContext
   * Returns a MediaStream with mixed audio
   */
  const setupAudioMixing = useCallback((): MediaStream | null => {
    try {
      // Clean up existing audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      const audioContext = new AudioContext({
        sampleRate: 48000,
        latencyHint: "interactive",
      });
      audioContextRef.current = audioContext;

      const destination = audioContext.createMediaStreamDestination();
      audioDestinationRef.current = destination;

      // Helper to add a track to the mixer
      const addAudioTrack = (stream: MediaStream | null, label: string) => {
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
          console.warn(`⚠️ No audio track in ${label} stream`);
          return;
        }

        try {
          const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
          const gain = audioContext.createGain();
          gain.gain.value = 1.0;
          source.connect(gain);
          gain.connect(destination);
          console.log(`✅ Added ${label} audio to mixer`);
        } catch (err) {
          console.error(`Failed to add ${label} audio:`, err);
        }
      };

      // Add local audio
      addAudioTrack(localStreamRef.current, "local");

      // Add remote audio
      addAudioTrack(remoteStreamRef.current, "remote");

      // Resume audio context
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(console.error);
      }

      return destination.stream;
    } catch (error) {
      console.error("Failed to setup audio mixing:", error);
      return null;
    }
  }, []);

  /**
   * Start the recording
   */
  const startRecording = useCallback(async () => {
    if (!callState.isInCall) {
      alert("Cannot start recording: No active call");
      return;
    }

    try {
      // 1. Setup canvas
      if (!setupRecordingCanvas()) {
        alert("Failed to setup recording canvas");
        return;
      }

      // 2. Setup audio mixing
      const audioStream = setupAudioMixing();
      if (!audioStream) {
        alert("Failed to setup audio mixing");
        return;
      }

      // 3. Get canvas stream
      const canvas = recordingCanvasRef.current;
      if (!canvas) {
        alert("Recording canvas not available");
        return;
      }

      const canvasStream = canvas.captureStream(30);
      const videoTrack = canvasStream.getVideoTracks()[0];
      if (!videoTrack) {
        alert("Failed to capture canvas video");
        return;
      }

      // 4. Combine video and audio streams
      const combinedStream = new MediaStream();
      combinedStream.addTrack(videoTrack);

      // Add audio tracks from the mixed audio stream
      audioStream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      combinedRecorderStreamRef.current = combinedStream;

      // 5. Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Save the recording
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `call-recording-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          console.log(`✅ Recording saved: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        } else {
          console.warn("⚠️ Recording blob is empty");
        }

        // Clean up recording resources
        cleanupRecordingResources();
      };

      // 6. Start recording
      recorder.start(1000); // Capture data every second
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();

      // 7. Start render loop
      recordingCanvasReadyRef.current = true;
      startRecordingRenderLoop();

      // 8. Update state
      setCallState((prev) => ({ ...prev, isRecording: true }));

      console.log("✅ Recording started successfully");
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording. Please try again.");
      cleanupRecordingResources();
    }
  }, [callState.isInCall, setupRecordingCanvas, setupAudioMixing, startRecordingRenderLoop]);

  /**
   * Stop the recording and save the file
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      // If recorder is not in recording state, just clean up
      cleanupRecordingResources();
    }

    setCallState((prev) => ({ ...prev, isRecording: false }));
    console.log("⏹️ Recording stopped");
  }, []);

  /**
   * Clean up recording resources
   */
  const cleanupRecordingResources = useCallback(() => {
    // Stop animation loop
    if (recordingAnimationRef.current) {
      cancelAnimationFrame(recordingAnimationRef.current);
      recordingAnimationRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        // Ignore
      }
      mediaRecorderRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    audioDestinationRef.current = null;

    // Stop combined stream
    if (combinedRecorderStreamRef.current) {
      combinedRecorderStreamRef.current.getTracks().forEach((t) => t.stop());
      combinedRecorderStreamRef.current = null;
    }

    recordingStreamRef.current = null;
    recordingCanvasReadyRef.current = false;

    // Don't clear recordedChunksRef here because they're needed for saving
    // They will be cleared on next recording start

    console.log("🧹 Recording resources cleaned up");
  }, []);

  // ---- Cleanup call ----
  const cleanupCall = () => {
    console.log("Cleaning up call...");
    isCallEndedRef.current = true;

    // Stop recording if active
    if (callState.isRecording) {
      stopRecording();
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    videoSenderRef.current = null;
    if (blackTrackRef.current) {
      blackTrackRef.current.stop();
      blackTrackRef.current = null;
    }

    // Clean up recording resources
    cleanupRecordingResources();

    setCallState({
      isCalling: false,
      isInCall: false,
      callType: null,
      callerId: null,
      calleeId: null,
      isMuted: false,
      isCameraOn: true,
      isScreenSharing: false,
      isRecording: false,
      callStatus: "idle",
    });
    setIncomingCall(null);
    setIsCaller(false);
    setCallerName("");
  };

  // ---- Start local stream ----
  const startLocalStream = async (video: boolean) => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });

      localStreamRef.current = stream;

      if (video) {
        cameraStreamRef.current = stream;
      }

      return stream;
    } catch (error: any) {
      console.error(error);

      if (error.name === "NotReadableError") {
        if (cameraStreamRef.current) {
          console.log("Reusing existing camera stream");
          return cameraStreamRef.current;
        }
        alert("Camera is already in use by another application.");
      } else if (error.name === "NotAllowedError") {
        alert("Camera permission denied.");
      } else {
        alert("Unable to access camera/microphone.");
      }

      return null;
    }
  };

  // ---- Replace video track in peer connection and local stream ----
  const replaceVideoTrack = async (newTrack: MediaStreamTrack | null) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    let sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (!sender) {
      if (newTrack && localStreamRef.current) {
        sender = pc.addTrack(newTrack, localStreamRef.current);
        videoSenderRef.current = sender;
      }
      return;
    }

    if (!newTrack) {
      if (sender.track) {
        sender.track.enabled = false;
      }
      videoSenderRef.current = sender;
      return;
    }

    try {
      await sender.replaceTrack(newTrack);
      videoSenderRef.current = sender;
      if (localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack && oldVideoTrack !== newTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        if (!localStreamRef.current.getVideoTracks().includes(newTrack)) {
          localStreamRef.current.addTrack(newTrack);
        }
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch (error) {
      console.error("Error replacing video track:", error);
    }
  };

  // ---- Start call ----
  const startCall = async (userId: string, type: "voice" | "video") => {
    try {
      isCallEndedRef.current = false;
      const stream = await startLocalStream(type === "video");
      if (!stream) return;

      const user = users.find((u) => u._id === userId);
      setCallerName(user?.name || "User");
      setIsCaller(true);

      setCallState({
        isCalling: true,
        isInCall: false,
        callType: type,
        callerId: currentUser?._id || null,
        calleeId: userId,
        isMuted: false,
        isCameraOn: type === "video",
        isScreenSharing: false,
        isRecording: false,
        callStatus: "dialing",
      });

      socket.emit("call-user", {
        from: currentUser?._id,
        to: userId,
        type,
        fromName: currentUser?.name,
      });

      await createPeerConnection(stream, userId, true);
    } catch (error) {
      console.error("Error starting call:", error);
      setCallState((prev) => ({ ...prev, isCalling: false, callStatus: "idle" }));
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      isCallEndedRef.current = false;
      const stream = await startLocalStream(incomingCall.type === "video");
      if (!stream) return;

      setCallState({
        isCalling: false,
        isInCall: true,
        callType: incomingCall.type,
        callerId: incomingCall.from,
        calleeId: currentUser?._id || null,
        isMuted: false,
        isCameraOn: incomingCall.type === "video",
        isScreenSharing: false,
        isRecording: false,
        callStatus: "connected",
      });

      socket.emit("accept-call", {
        from: currentUser?._id,
        to: incomingCall.from,
      });

      await createPeerConnection(stream, incomingCall.from, false);
      setIncomingCall(null);
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const rejectCall = () => {
    if (!incomingCall) return;

    socket.emit("reject-call", {
      from: currentUser?._id,
      to: incomingCall.from,
    });

    setIncomingCall(null);
    setCallState((prev) => ({ ...prev, callStatus: "idle" }));
    cleanupCall();
  };

  // ---- Peer connection ----
  const createPeerConnection = async (stream: MediaStream, remoteUserId: string, isCaller: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, stream);
      if (track.kind === "video") {
        videoSenderRef.current = sender;
      }
      console.log(`Added ${track.kind} track to peer connection`);
    });

    pc.ontrack = (event) => {
      console.log("Remote track received:", event.track.kind);

      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      remoteStreamRef.current.addTrack(event.track);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && !isCallEndedRef.current) {
        socket.emit("ice-candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);

      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        if (!isCallEndedRef.current && !isReconnectingRef.current) {
          isReconnectingRef.current = true;
          console.log("Attempting to reconnect...");

          setTimeout(async () => {
            try {
              if (isCaller && peerConnectionRef.current) {
                const offer = await peerConnectionRef.current.createOffer();
                await peerConnectionRef.current.setLocalDescription(offer);
                socket.emit("offer", {
                  to: remoteUserId,
                  offer,
                });
              }
              isReconnectingRef.current = false;
            } catch (error) {
              console.error("Reconnection failed:", error);
              isReconnectingRef.current = false;
            }
          }, 2000);
        }
      }

      if (pc.iceConnectionState === "closed") {
        if (!isCallEndedRef.current) {
          cleanupCall();
        }
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log("Negotiation needed");
      if (!isCallEndedRef.current && !isReconnectingRef.current) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", {
            to: remoteUserId,
            offer,
          });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }
    };

    if (isCaller) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", {
          to: remoteUserId,
          offer,
        });
      } catch (error) {
        console.error("Error creating initial offer:", error);
      }
    }
  };

  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
    if (isCallEndedRef.current) return;

    let pc = peerConnectionRef.current;

    if (!pc) {
      const stream = localStreamRef.current;
      if (!stream) return;
      await createPeerConnection(stream, data.from, false);
      pc = peerConnectionRef.current;
    }

    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", {
        to: data.from,
        answer,
      });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
    if (isCallEndedRef.current) return;

    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

      setCallState((prev) => {
        if (prev.callStatus === "dialing") {
          return {
            ...prev,
            isCalling: false,
            isInCall: true,
            callStatus: "connected",
          };
        }
        return prev;
      });
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
    if (isCallEndedRef.current) return;

    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  // ---- Toggle Mute ----
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  };

  // ---- Toggle Camera ----
  const toggleCamera = async () => {
    if (callState.isScreenSharing) {
      alert("Camera toggle is disabled during screen sharing.");
      return;
    }

    try {
      if (callState.isCameraOn) {
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((track) => track.stop());
          cameraStreamRef.current = null;
        }

        const blackTrack = createBlackTrack();
        await replaceVideoTrack(blackTrack);

        setCallState((prev) => ({ ...prev, isCameraOn: false }));
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        cameraStreamRef.current = newStream;
        const cameraTrack = newStream.getVideoTracks()[0];
        if (!cameraTrack) {
          throw new Error("No video track found");
        }
        cameraTrack.enabled = true;

        await replaceVideoTrack(cameraTrack);

        setCallState((prev) => ({ ...prev, isCameraOn: true }));
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      alert("Failed to toggle camera. Please check permissions.");
    }
  };

  // ---- Toggle Screen Share ----
  const toggleScreenShare = async () => {
    try {
      if (callState.isScreenSharing) {
        if (callState.isCameraOn && cameraStreamRef.current) {
          const cameraTrack = cameraStreamRef.current.getVideoTracks()[0];
          if (cameraTrack) {
            await replaceVideoTrack(cameraTrack);
          }
        } else {
          const blackTrack = createBlackTrack();
          await replaceVideoTrack(blackTrack);
        }

        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }

        setCallState((prev) => ({ ...prev, isScreenSharing: false }));
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      await replaceVideoTrack(screenTrack);

      screenTrack.onended = () => {
        if (callState.isCameraOn && cameraStreamRef.current) {
          const cameraTrack = cameraStreamRef.current.getVideoTracks()[0];
          if (cameraTrack) {
            replaceVideoTrack(cameraTrack);
          }
        } else {
          const blackTrack = createBlackTrack();
          replaceVideoTrack(blackTrack);
        }

        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }

        setCallState((prev) => ({ ...prev, isScreenSharing: false }));
      };

      setCallState((prev) => ({ ...prev, isScreenSharing: true }));
    } catch (error) {
      console.error("Error sharing screen:", error);
      alert("Screen sharing failed. Please try again.");
    }
  };

  // ---- Toggle Recording (COMPLETELY REWRITTEN) ----
  const toggleRecording = () => {
    if (callState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const endCall = () => {
    if (!isCallEndedRef.current) {
      if (callState.calleeId) {
        socket.emit("end-call", {
          to: callState.calleeId,
        });
      }
      if (callState.callerId && !isCaller) {
        socket.emit("end-call", {
          to: callState.callerId,
        });
      }
    }
    cleanupCall();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a2e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#050510] via-[#0a0a2e] to-[#0d1b3e] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Talk to Friends
          </h1>
          <p className="text-blue-200/80 mt-2">
            Voice and Video calls with your friends
          </p>
        </div>

        {/* Calling Screen */}
        {(callState.callStatus === "dialing" || callState.callStatus === "ringing") && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-linear-to-br from-gray-900/90 to-blue-950/90 p-12 rounded-3xl border border-blue-500/30 text-center max-w-md w-full">
              <div className="text-7xl mb-6 animate-pulse">
                {callState.callType === "video" ? "📹" : "📞"}
              </div>
              <h3 className="text-3xl font-semibold mb-2">
                {callState.callStatus === "dialing" ? "Calling..." : "Incoming Call"}
              </h3>
              <p className="text-gray-300 text-lg mb-2">{callerName}</p>
              <p className="text-gray-400 text-sm mb-8">
                {callState.callStatus === "dialing" ? "Please wait..." : "is calling you"}
              </p>

              {callState.callStatus === "ringing" ? (
                <div className="flex gap-6 justify-center">
                  <button
                    onClick={acceptCall}
                    className="px-10 py-4 bg-linear-to-r from-green-600 to-emerald-600 rounded-2xl font-semibold text-lg hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/30"
                  >
                    Accept
                  </button>
                  <button
                    onClick={rejectCall}
                    className="px-10 py-4 bg-linear-to-r from-red-600 to-rose-600 rounded-2xl font-semibold text-lg hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-500/30"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <button
                  onClick={endCall}
                  className="px-10 py-4 bg-linear-to-r from-red-600 to-rose-600 rounded-2xl font-semibold text-lg hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-500/30"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Call Interface */}
        {callState.isInCall && (
          <div className="fixed inset-0 bg-black z-40 flex flex-col">
            {/* Video Grid */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full max-h-[80vh]">
                {/* Remote Video */}
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 text-sm text-gray-300 bg-black/50 px-3 py-1 rounded">
                    {callerName}
                  </div>
                  {!remoteStreamRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <span className="text-4xl">🔄</span>
                    </div>
                  )}
                </div>

                {/* Local Video */}
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 text-sm text-gray-300 bg-black/50 px-3 py-1 rounded">
                    You {callState.isMuted && "🔇"} {callState.isScreenSharing && "🖥️"}
                  </div>
                  {!localStreamRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="bg-linear-to-t from-black to-transparent p-6 flex items-center justify-center gap-4 flex-wrap">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  callState.isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
                }`}
                title="Mute"
              >
                {callState.isMuted ? "🔇" : "🎤"}
              </button>

              {/* Camera */}
              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-all ${
                  !callState.isCameraOn ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
                }`}
                title="Camera"
              >
                {callState.isCameraOn ? "📷" : "🚫"}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-all ${
                  callState.isScreenSharing ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"
                }`}
                title="Share Screen"
              >
                🖥️
              </button>

              {/* Record - UPDATED to show recording state clearly */}
              <button
                onClick={toggleRecording}
                className={`p-4 rounded-full transition-all ${
                  callState.isRecording
                    ? "bg-red-600 animate-pulse hover:bg-red-700 ring-2 ring-red-400 ring-offset-2 ring-offset-black"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={callState.isRecording ? "Stop Recording" : "Start Recording"}
              >
                {callState.isRecording ? "⏹️" : "⏺️"}
              </button>

              {/* End Call */}
              <button
                onClick={endCall}
                className="px-8 py-4 bg-linear-to-r from-red-600 to-rose-600 rounded-full font-semibold hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-500/30"
              >
                End Call
              </button>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-linear-to-br from-gray-900/90 to-blue-950/90 backdrop-blur-sm p-6 rounded-2xl border border-blue-500/30 hover:border-blue-500/60 transition-all"
            >
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${
                      user.isOnline ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user.name}</h3>
                  <p className={`text-sm ${user.isOnline ? "text-green-400" : "text-gray-400"}`}>
                    {user.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => startCall(user._id, "voice")}
                  disabled={!user.isOnline || callState.isInCall || callState.isCalling}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    user.isOnline && !callState.isInCall && !callState.isCalling
                      ? "bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                      : "bg-gray-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  📞 Voice
                </button>
                <button
                  onClick={() => startCall(user._id, "video")}
                  disabled={!user.isOnline || callState.isInCall || callState.isCalling}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    user.isOnline && !callState.isInCall && !callState.isCalling
                      ? "bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                      : "bg-gray-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  📹 Video
                </button>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-gray-400">No other users found</p>
          </div>
        )}
      </div>

      {/* ============================================================
          NEW: Hidden Recording Canvas
          This canvas is used to composite the video layout for recording.
          It's hidden from the UI but used by the MediaRecorder.
          ============================================================ */}
      <canvas
        ref={recordingCanvasRef}
        style={{ display: "none" }}
        width="1280"
        height="720"
      />
    </div>
  );
}