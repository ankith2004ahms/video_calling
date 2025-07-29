import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import peerService from "../services/peer";
import { useNavigate } from "react-router-dom";

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
                myStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [myStream]);

    

    const handleUserJoined = useCallback((data: any) => {
        const { id } = data;
        setRemoteSocketId(id);
    }, [setRemoteSocketId]);
    
    const handleMute = useCallback(() => {
        if (myStream) {
            myStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
        setIsMuted(prev=>!prev);
    }, [myStream]);

    const handleVideoToggle = useCallback(()=>{
        if(myStream){
            myStream.getVideoTracks().forEach(track=>{
                track.enabled = !track.enabled;
            });
        }
        setIsVideoOn(prev=>!prev);
    },[myStream]);

    const hangUp = useCallback(() => {
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
        
        // Optionally navigate back to lobby
        navigate("/join");
    }, [myStream]);

    const handleUserLeft = useCallback((data: any) => {
        const {  id } = data;
        if (id === remoteSocketId) {
            setRemoteSocketId("");
            setRemoteStream(null);
            setIsCallActive(false);
            // Reset peer connection for next call
            peerService.reset();
        }
    }, [remoteSocketId]);

    const handleRoomJoined = useCallback((data: any) => {
        const {  existingUsers } = data;
        
        // If there are existing users, connect to the first one
        if (existingUsers && existingUsers.length > 0) {
            const firstUser = existingUsers[0];
            setRemoteSocketId(firstUser.id);
        }
    }, []);

    const handleCallMade = useCallback(async (data: any) => {
        const { offer, from } = data;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
    }, [socket]);

    const handleAnswerMade = useCallback(async (data: any) => {
        const { answer } = data;
        
        try {
            await peerService.setRemoteAnswer(answer);
            setIsCallActive(true);
        } catch (error) {
            console.error("Error handling answer:", error);
        }
    }, []);

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

    const handleOfferMade = useCallback(async (data: any) => {
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
    }, [socket]);

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

        return () => {
            socket.off("user-joined", handleUserJoined);
            socket.off("user-left", handleUserLeft);
            socket.off("joined-room", handleRoomJoined);
            socket.off("call-made", handleCallMade);
            socket.off("answer-made", handleAnswerMade);
            socket.off("ice-candidate", handleIceCandidate);
            socket.off("offer-made", handleOfferMade);
        };
    }, [socket, handleUserJoined, handleUserLeft, handleRoomJoined, handleCallMade, handleAnswerMade, handleIceCandidate, handleOfferMade]);

    const handleCallUser = useCallback(async () => {
        if (!remoteSocketId) {
            console.error("No remote user to call");
            return;
        }

        console.log("Initiating call to:", remoteSocketId);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

    

    return (
        <div style={{ padding: "20px" }}>
            <h1>Video Call Room</h1>
            <h4>
                {remoteSocketId ? 
                    `Connected to user: ${remoteSocketId}` : 
                    "Waiting for user to join..."
                }
            </h4>
            
            <div style={{ marginBottom: "20px" }}>
                {remoteSocketId && !isCallActive && (
                    <button onClick={handleCallUser} style={{ 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        padding: "10px 20px", 
                        border: "none", 
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}>
                        Start Video Call
                    </button>
                )}
                
            </div>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {myStream && (
                    <div>
                        <h5>My Video</h5>
                        <video
                            style={{ 
                                width: "300px", 
                                height: "200px", 
                                border: "2px solid #007bff",
                                borderRadius: "8px"
                            }}
                            autoPlay
                            playsInline
                            muted
                            ref={videoElement => {
                                if (videoElement && myStream) {
                                    videoElement.srcObject = myStream;
                                }
                            }}
                        />
                    </div>
                )}
                
                {remoteStream ? (
                    <div>
                        <h5>Remote Video</h5>
                        <video
                            style={{ 
                                width: "400px", 
                                height: "600px",
                                border: "2px solid #28a745",
                                borderRadius: "8px"
                            }}
                            autoPlay
                            playsInline
                            ref={remoteVideoRef}
                        />
                    </div>
                ) : (
                    <div>
                        <h5>Remote Video</h5>
                        <div style={{ 
                            width: "400px", 
                            height: "600px",
                            border: "2px dashed #6c757d",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6c757d"
                        }}>
                            {remoteSocketId ? "Waiting for remote video..." : "No remote user connected"}
                        </div>
                    </div>
                )}
            </div>
            <div style={{ marginTop: "20px" }}>
                <button onClick={handleMute} style={{
                    backgroundColor: "#007bff",
                }}>
                    {isMuted ? "Unmute" : "Mute"}
                </button>
            </div>
            <div style={{ marginTop: "20px" }}>
                <button onClick={handleVideoToggle} style={{
                    backgroundColor: "#007bff",
                }}>
                    {isVideoOn ? "Turn Off Video" : "Turn On Video"}
                </button>
            </div>
            <div style={{ marginTop: "20px" }}>
                <button onClick={hangUp} style={{
                    backgroundColor: "#dc3545",
                }}>
                    Hang Up
                </button>
            </div>

            
        </div>
    );
}