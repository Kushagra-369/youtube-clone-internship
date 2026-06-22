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
  });
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    fromName: string;
    type: "voice" | "video";
  } | null>(null);

  // Refs for media
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  // Get current user from localStorage or context
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchUsers();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!currentUser) return;

    // Connect socket
    socket.emit("user-online", currentUser._id);

    // Listen for online users
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

    // Incoming call
    socket.on("incoming-call", (data: { from: string; fromName: string; type: "voice" | "video" }) => {
      setIncomingCall(data);
    });

    // Call accepted
    socket.on("call-accepted", async (data: { from: string }) => {
      setCallState(prev => ({ ...prev, isInCall: true, isCalling: false }));
      if (callState.callType === "video") {
        await startLocalStream(true);
      } else {
        await startLocalStream(false);
      }
    });

    // Call rejected
    socket.on("call-rejected", () => {
      setCallState(prev => ({ ...prev, isCalling: false }));
      alert("Call rejected");
    });

    // Call ended
    socket.on("call-ended", () => {
      endCall();
    });

    // WebRTC signaling
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

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
      // Filter out current user
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

  // Start local stream
  const startLocalStream = async (video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Unable to access camera/microphone");
      return null;
    }
  };

  // Start call
  const startCall = async (userId: string, type: "voice" | "video") => {
    try {
      const stream = await startLocalStream(type === "video");
      if (!stream) return;

      setCallState({
        isCalling: true,
        isInCall: false,
        callType: type,
        callerId: currentUser?._id || null,
        calleeId: userId,
        isMuted: false,
        isCameraOn: true,
        isScreenSharing: false,
        isRecording: false,
      });

      // Emit call request
      socket.emit("call-user", {
        from: currentUser?._id,
        to: userId,
        type,
        fromName: currentUser?.name,
      });

      // Create peer connection
      await createPeerConnection(stream, userId);

    } catch (error) {
      console.error("Error starting call:", error);
      setCallState(prev => ({ ...prev, isCalling: false }));
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await startLocalStream(incomingCall.type === "video");
      if (!stream) return;

      setCallState({
        isCalling: false,
        isInCall: true,
        callType: incomingCall.type,
        callerId: incomingCall.from,
        calleeId: currentUser?._id || null,
        isMuted: false,
        isCameraOn: true,
        isScreenSharing: false,
        isRecording: false,
      });

      socket.emit("accept-call", {
        from: currentUser?._id,
        to: incomingCall.from,
      });

      await createPeerConnection(stream, incomingCall.from);
      setIncomingCall(null);

    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall) return;
    socket.emit("reject-call", {
      from: currentUser?._id,
      to: incomingCall.from,
    });
    setIncomingCall(null);
  };

  // Create peer connection
  const createPeerConnection = async (stream: MediaStream, remoteUserId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });
    peerConnectionRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    // Create offer if caller
    if (callState.callerId === currentUser?._id) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", {
        to: remoteUserId,
        offer,
      });
    }
  };

  // Handle offer
  const handleOffer = async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", {
      to: data.from,
      answer,
    });
  };

  // Handle answer
  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  };

  // Handle ICE candidate
  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isCameraOn: !prev.isCameraOn }));
      }
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (callState.isScreenSharing) {
      // Stop screen sharing
      const screenTrack = localStreamRef.current?.getVideoTracks().find(t => t.kind === "video");
      if (screenTrack) {
        screenTrack.stop();
      }
      setCallState(prev => ({ ...prev, isScreenSharing: false }));
      // Restore camera
      await startLocalStream(true);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === "video");
        if (sender && screenTrack) {
          sender.replaceTrack(screenTrack);
          screenTrack.onended = () => {
            setCallState(prev => ({ ...prev, isScreenSharing: false }));
          };
          setCallState(prev => ({ ...prev, isScreenSharing: true }));
        }
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (callState.isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setCallState(prev => ({ ...prev, isRecording: false }));
    } else {
      // Start recording
      if (localStreamRef.current) {
        const recorder = new MediaRecorder(localStreamRef.current);
        recordedChunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `call-recording-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setCallState(prev => ({ ...prev, isRecording: true }));
      }
    }
  };

  // End call
  const endCall = () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Emit end call
    if (callState.calleeId) {
      socket.emit("end-call", {
        to: callState.calleeId,
      });
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
    });
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

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-linear-to-br from-gray-900/90 to-blue-950/90 p-8 rounded-2xl border border-blue-500/30 text-center max-w-md w-full">
              <div className="text-6xl mb-4">
                {incomingCall.type === "video" ? "📹" : "📞"}
              </div>
              <h3 className="text-2xl font-semibold mb-2">Incoming Call</h3>
              <p className="text-gray-300 mb-6">
                {incomingCall.fromName} is calling you via {incomingCall.type} call
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={acceptCall}
                  className="px-8 py-3 bg-linear-to-r from-green-600 to-emerald-600 rounded-xl font-semibold hover:from-green-500 hover:to-emerald-500 transition-all"
                >
                  Accept
                </button>
                <button
                  onClick={rejectCall}
                  className="px-8 py-3 bg-linear-to-r from-red-600 to-rose-600 rounded-xl font-semibold hover:from-red-500 hover:to-rose-500 transition-all"
                >
                  Reject
                </button>
              </div>
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
                    {callState.calleeId ? "Friend" : "Connecting..."}
                  </div>
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
                    You {callState.isMuted && "🔇"}
                  </div>
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="bg-linear-to-t from-black to-transparent p-6 flex items-center justify-center gap-4 flex-wrap">
              {/* Mute */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  callState.isMuted
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
                className={`p-4 rounded-full transition-all ${
                  !callState.isCameraOn
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
                className={`p-4 rounded-full transition-all ${
                  callState.isScreenSharing
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
                className={`p-4 rounded-full transition-all ${
                  callState.isRecording
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
                  disabled={!user.isOnline}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    user.isOnline
                      ? "bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                      : "bg-gray-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  📞 Voice
                </button>
                <button
                  onClick={() => startCall(user._id, "video")}
                  disabled={!user.isOnline}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    user.isOnline
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