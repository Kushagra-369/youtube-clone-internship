// pages/talk_to_friends.tsx
import { useState, useEffect, useRef } from "react";
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const isCallEndedRef = useRef<boolean>(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const isReconnectingRef = useRef<boolean>(false);
  const videoSenderRef = useRef<RTCRtpSender | null>(null);
  const blackTrackRef = useRef<MediaStreamTrack | null>(null); // black video track

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
      setUsers(prev =>
        prev.map(u =>
          u._id === userId ? { ...u, isOnline: true } : u
        )
      );
    });

    socket.on("user-offline", (userId: string) => {
      setUsers(prev =>
        prev.map(u =>
          u._id === userId ? { ...u, isOnline: false } : u
        )
      );
    });

    socket.on("incoming-call", (data: { from: string; fromName: string; type: "voice" | "video" }) => {
      setIncomingCall(data);
      setCallerName(data.fromName);
      setCallState(prev => ({ ...prev, callStatus: "ringing" }));
      setIsCaller(false);
    });

    socket.on("call-accepted", () => {
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isCalling: false,
        callStatus: "connected",
      }));
    });

    socket.on("call-rejected", (data?: { from?: string }) => {
      console.log("Call rejected:", data);
      setCallState(prev => ({
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
      setCallState(prev => ({
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
      // If already created, just return a clone (so we can reuse)
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

  const cleanupCall = () => {
    console.log("Cleaning up call...");
    isCallEndedRef.current = true;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
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
      } else {
        // Voice call: no video track, we'll add black track later if needed
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
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

    // Find video sender
    let sender = pc.getSenders().find(s => s.track?.kind === "video");
    if (!sender) {
      // If no sender exists, create one
      if (newTrack && localStreamRef.current) {
        sender = pc.addTrack(newTrack, localStreamRef.current);
        videoSenderRef.current = sender;
      }
      return;
    }

    // If newTrack is null, we will disable the current track instead of removing
    if (!newTrack) {
      if (sender.track) {
        sender.track.enabled = false;
      }
      videoSenderRef.current = sender;
      return;
    }

    // Replace the track
    try {
      await sender.replaceTrack(newTrack);
      videoSenderRef.current = sender;
      // Update localStream
      if (localStreamRef.current) {
        // Remove old video track if exists
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack && oldVideoTrack !== newTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        // Add new track if not already present
        if (!localStreamRef.current.getVideoTracks().includes(newTrack)) {
          localStreamRef.current.addTrack(newTrack);
        }
      }
      // Update local preview
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

      const user = users.find(u => u._id === userId);
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
      setCallState(prev => ({ ...prev, isCalling: false, callStatus: "idle" }));
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
    setCallState(prev => ({ ...prev, callStatus: "idle" }));
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

    // Add all tracks from local stream
    stream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, stream);
      if (track.kind === "video") {
        videoSenderRef.current = sender;
      }
    });

    // Handle remote stream
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

    // Handle ICE candidates
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
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  };

  // ---- Toggle Camera ----
  const toggleCamera = async () => {
    // Screen share chal raha hai toh camera toggle mat karo
    if (callState.isScreenSharing) {
      alert("Camera toggle is disabled during screen sharing.");
      return;
    }

    try {
      if (callState.isCameraOn) {
        // ---- Camera OFF ----
        // 1. Stop actual camera track
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => track.stop());
          cameraStreamRef.current = null;
        }

        // 2. Replace with black track
        const blackTrack = createBlackTrack();
        await replaceVideoTrack(blackTrack);

        setCallState(prev => ({ ...prev, isCameraOn: false }));
      } else {
        // ---- Camera ON ----
        // 1. Get new camera stream
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

        // 2. Replace black track with camera track
        await replaceVideoTrack(cameraTrack);

        setCallState(prev => ({ ...prev, isCameraOn: true }));
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
        // Stop screen sharing: restore camera or black track
        if (callState.isCameraOn && cameraStreamRef.current) {
          const cameraTrack = cameraStreamRef.current.getVideoTracks()[0];
          if (cameraTrack) {
            await replaceVideoTrack(cameraTrack);
          }
        } else {
          // Camera is off, use black track
          const blackTrack = createBlackTrack();
          await replaceVideoTrack(blackTrack);
        }

        // Clean up screen stream
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }

        setCallState(prev => ({ ...prev, isScreenSharing: false }));
        return;
      }

      // Start screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace video track with screen track
      await replaceVideoTrack(screenTrack);

      // Handle screen share end (user clicks "Stop sharing" in browser)
      screenTrack.onended = () => {
        // Restore camera or black
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
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }

        setCallState(prev => ({ ...prev, isScreenSharing: false }));
      };

      setCallState(prev => ({ ...prev, isScreenSharing: true }));
    } catch (error) {
      console.error("Error sharing screen:", error);
      alert("Screen sharing failed. Please try again.");
    }
  };

  // ---- Toggle Recording ----
  const toggleRecording = () => {
    if (callState.isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setCallState(prev => ({ ...prev, isRecording: false }));
      return;
    }

    try {
      // Create a combined stream for recording
      const combinedStream = new MediaStream();

      // Add local audio
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track.clone());
        });
      }

      // Add remote audio
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track.clone());
        });
      }

      // Add video from local stream (could be camera, screen, or black)
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          // Clone the track to avoid interfering with the call
          const clonedVideo = videoTrack.clone();
          // Ensure it's enabled
          clonedVideo.enabled = true;
          combinedStream.addTrack(clonedVideo);
        }
      }

      // If no video track at all, add a black track
      if (combinedStream.getVideoTracks().length === 0) {
        const blackTrack = createBlackTrack();
        combinedStream.addTrack(blackTrack);
      }

      // Check if we have any tracks
      if (combinedStream.getTracks().length === 0) {
        alert("No media streams available to record");
        return;
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : "video/webm",
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `call-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);

        // Clean up combined stream
        combinedStream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setCallState(prev => ({ ...prev, isRecording: true }));

      console.log("Recording started successfully");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please try again.");
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
                className={`p-4 rounded-full transition-all ${callState.isMuted
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                  }`}
                title="Mute"
              >
                {callState.isMuted ? "🔇" : "🎤"}
              </button>

              {/* Camera */}
              <button
                onClick={toggleCamera}
                className={`p-4 rounded-full transition-all ${!callState.isCameraOn
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                  }`}
                title="Camera"
              >
                {callState.isCameraOn ? "📷" : "🚫"}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-full transition-all ${callState.isScreenSharing
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                  }`}
                title="Share Screen"
              >
                🖥️
              </button>

              {/* Record */}
              <button
                onClick={toggleRecording}
                className={`p-4 rounded-full transition-all ${callState.isRecording
                    ? "bg-red-600 animate-pulse hover:bg-red-700"
                    : "bg-gray-700 hover:bg-gray-600"
                  }`}
                title="Record"
              >
                ⏺️
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
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${user.isOnline ? "bg-green-500" : "bg-gray-500"
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
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${user.isOnline && !callState.isInCall && !callState.isCalling
                      ? "bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                      : "bg-gray-700 cursor-not-allowed opacity-50"
                    }`}
                >
                  📞 Voice
                </button>
                <button
                  onClick={() => startCall(user._id, "video")}
                  disabled={!user.isOnline || callState.isInCall || callState.isCalling}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${user.isOnline && !callState.isInCall && !callState.isCalling
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
    </div>
  );
}