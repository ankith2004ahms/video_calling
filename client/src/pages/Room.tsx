import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import peerService from "../services/peer";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Send, 
  Users, 
  MessageSquare,
  Phone
} from "lucide-react";

export default function RoomPage() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteSocketId, setRemoteSocketId] = useState<string>("");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [remoteMessages, setRemoteMessages] = useState<string[]>([]);

  // Get room name from URL
  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get('room') || 'Unknown Room';

  // Set up callbacks when component mounts or remote socket changes
  useEffect(() => {
    peerService.setOnRemoteStream((stream) => {
      setRemoteStream(stream);
      setIsCallActive(true);
    });

    peerService.setOnIceCandidate((candidate) => {
      console.log("Generated ICE candidate, remote user:", remoteSocketId);
      if (remoteSocketId && socket) {
        socket.emit("ice-candidate", { candidate, to: remoteSocketId });
      } else {
        console.warn("Cannot send ICE candidate: no remote user or socket");
      }
    });
  }, [socket, remoteSocketId]);

  // Cleanup local stream on unmount
  useEffect(() => {
    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [myStream]);

  const handleUserJoined = useCallback(
    (data: any) => {
      const { id } = data;
      setRemoteSocketId(id);
    },
    [setRemoteSocketId]
  );

  const handleMute = useCallback(() => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted((prev) => !prev);
  }, [myStream]);

  const handleVideoToggle = useCallback(() => {
    if (myStream) {
      myStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOn((prev) => !prev);
  }, [myStream]);

  const hangUp = useCallback(() => {
    // Get current room from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const currentRoom = urlParams.get('room');
    
    // Emit hang-up event to notify other users
    if (currentRoom && socket) {
        socket.emit("hang-up", { room: currentRoom });
    }
    
    // Stop local stream
    if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
        setMyStream(null);
    }
    
    // Reset states
    setRemoteStream(null);
    setIsCallActive(false);
    setRemoteSocketId("");
    
    // Reset peer service
    peerService.reset();
    
    // Navigate back to lobby
    navigate("/join");
}, [myStream, socket, navigate]);

  const handleUserLeft = useCallback(
    (data: any) => {
      const { id } = data;
      if (id === remoteSocketId) {
        setRemoteSocketId("");
        setRemoteStream(null);
        setIsCallActive(false);
        // Reset peer connection for next call
        peerService.reset();
      }
    },
    [remoteSocketId]
  );

  const handleRoomJoined = useCallback((data: any) => {
    const { existingUsers } = data;

    // If there are existing users, connect to the first one
    if (existingUsers && existingUsers.length > 0) {
      const firstUser = existingUsers[0];
      setRemoteSocketId(firstUser.id);
    }
  }, []);

  const handleCallMade = useCallback(
    async (data: any) => {
      const { offer, from } = data;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMyStream(stream);
        setRemoteSocketId(from);

        // Add tracks before creating answer
        peerService.addTrack(stream);

        const answer = await peerService.getAnswer(offer);
        if (answer) {
          socket?.emit("make-answer", { answer, to: from });
          setIsCallActive(true);
        } else {
          console.error("Failed to create answer");
        }
      } catch (error) {
        console.error("Error handling incoming call:", error);
      }
    },
    [socket]
  );

  const handleAnswerMade = useCallback(async (data: any) => {
    const { answer } = data;

    try {
      await peerService.setRemoteAnswer(answer);
      setIsCallActive(true);
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  }, []);

  const handleUserHungUp = useCallback(() => {
    // Stop local stream
    if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
        setMyStream(null);
    }
    
    // Reset states
    setRemoteStream(null);
    setIsCallActive(false);
    setRemoteSocketId("");
    
    // Reset peer service
    peerService.reset();
    
    // Navigate back to lobby
    navigate("/join");
}, [myStream, navigate]);

  const handleNegotiationNeeded = useCallback(async () => {
    console.log("Negotiation needed with:", remoteSocketId);
    if (!remoteSocketId) return;

    try {
      const offer = await peerService.getOffer();
      if (offer) {
        socket?.emit("make-offer", { offer, to: remoteSocketId });
      }
    } catch (error) {
      console.error("Error during renegotiation:", error);
    }
  }, [remoteSocketId, socket]);

  const handleOfferMade = useCallback(
    async (data: any) => {
      const { offer, from } = data;

      try {
        await peerService.setRemoteOffer(offer);
        const answer = await peerService.getAnswer(offer);
        if (answer) {
          socket?.emit("make-answer", { answer, to: from });
        }
      } catch (error) {
        console.error("Error handling renegotiation offer:", error);
      }
    },
    [socket]
  );

  const handleSendMessage = useCallback(() => {
    if (message.trim() && socket) {
      socket.emit("send-message", { message, to: remoteSocketId });
      setRemoteMessages((prev) => [...prev, `You: ${message}`]);
      setMessage("");
    }
  }, [message, socket, remoteSocketId]);

  const handleReceiveMessage = useCallback((data: any) => {
    const { message } = data;
    setRemoteMessages((prev) => [...prev, `Remote: ${message}`]);
  }, []);

  useEffect(() => {
    peerService.addNegotiationNeededListener(handleNegotiationNeeded);
    return () => {
      peerService.removeNegotiationNeededListener(handleNegotiationNeeded);
    };
  }, [handleNegotiationNeeded]);

  const handleIceCandidate = useCallback((data: any) => {
    const { candidate } = data;
    peerService.addIceCandidate(candidate);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("joined-room", handleRoomJoined);
    socket.on("call-made", handleCallMade);
    socket.on("answer-made", handleAnswerMade);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("offer-made", handleOfferMade);
    socket.on("user-hung-up", handleUserHungUp);
    socket.on("receive-message", handleReceiveMessage);
    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("joined-room", handleRoomJoined);
      socket.off("call-made", handleCallMade);
      socket.off("answer-made", handleAnswerMade);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("offer-made", handleOfferMade);
      socket.off("user-hung-up", handleUserHungUp);
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [
    socket,
    handleUserJoined,
    handleUserLeft,
    handleRoomJoined,
    handleCallMade,
    handleAnswerMade,
    handleIceCandidate,
    handleOfferMade,
    handleUserHungUp,
    handleReceiveMessage,
  ]);

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId) {
      console.error("No remote user to call");
      return;
    }

    console.log("Initiating call to:", remoteSocketId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMyStream(stream);

      // Add tracks before creating offer
      peerService.addTrack(stream);

      const offer = await peerService.getOffer();
      if (offer) {
        socket?.emit("call-user", { offer, to: remoteSocketId });
        console.log("Call initiated with offer to:", remoteSocketId);
      } else {
        console.error("Failed to create offer for call");
      }
    } catch (error) {
      console.error("Error initiating call:", error);
    }
  }, [remoteSocketId, socket]);

  // Update remote video element when remote stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Video className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                MeetNow
              </h1>
              <p className="text-sm text-muted-foreground">Room: {roomName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{remoteSocketId ? '2' : '1'} participant{remoteSocketId ? 's' : ''}</span>
            </Badge>
            
            {remoteSocketId ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Waiting for others...
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Section */}
        <div className="flex-1 p-6">
          {/* Call Action */}
          {remoteSocketId && !isCallActive && (
            <div className="mb-6 text-center">
              <Card className="border-0 shadow-lg bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Button
                    onClick={handleCallUser}
                    className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Start Video Call
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Video Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* My Video */}
            {myStream && (
              <Card className="border-0 shadow-2xl overflow-hidden bg-background/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>You</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative">
                    <video
                      className="w-full h-64 lg:h-80 object-cover bg-black rounded-b-lg"
                      autoPlay
                      playsInline
                      muted
                      ref={(videoElement) => {
                        if (videoElement && myStream) {
                          videoElement.srcObject = myStream;
                        }
                      }}
                    />
                    {!isVideoOn && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-b-lg">
                        <VideoOff className="w-12 h-12 text-white/60" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Remote Video */}
            <Card className="border-0 shadow-2xl overflow-hidden bg-background/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${remoteStream ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{remoteSocketId ? 'Remote User' : 'Waiting...'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {remoteStream ? (
                  <video
                    className="w-full h-64 lg:h-80 object-cover bg-black rounded-b-lg"
                    autoPlay
                    playsInline
                    ref={remoteVideoRef}
                  />
                ) : (
                  <div className="w-full h-64 lg:h-80 bg-gradient-to-br from-muted/50 to-muted border-2 border-dashed border-muted-foreground/20 rounded-b-lg flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      {remoteSocketId ? "Waiting for video..." : "No participant yet"}
                    </p>
                    <p className="text-sm mt-2">
                      {remoteSocketId ? "They'll appear here once the call starts" : "Share the room code to invite others"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-96 border-l border-border/50 bg-background/50 backdrop-blur-sm flex flex-col">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </h2>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {remoteMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation!</p>
              </div>
            ) : (
              remoteMessages.map((msg, index) => {
                const isYou = msg.startsWith('You:');
                return (
                  <div
                    key={index}
                    className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        isYou
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.replace(/^(You:|Remote:)\s/, '')}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={!remoteSocketId}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !remoteSocketId}
                size="icon"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!remoteSocketId && (
              <p className="text-xs text-muted-foreground mt-2">
                Chat will be available once someone joins
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Control buttons */}
      {isCallActive && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 bg-background/80 backdrop-blur-sm rounded-full px-6 py-4 shadow-2xl border border-border/50">
          <Button
            onClick={handleMute}
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          <Button
            onClick={handleVideoToggle}
            variant={!isVideoOn ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {!isVideoOn ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </Button>

          <Button
            onClick={hangUp}
            variant="destructive"
            size="icon"
            className="rounded-full w-12 h-12 bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}