import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import peerService from "../services/peer";

export default function RoomPage() {
    const socket = useSocket();
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [remoteSocketId, setRemoteSocketId] = useState<string>("");
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const handleUserJoined = useCallback((data: any) => {
        console.log("user joined", data);
        setRemoteSocketId(data.id);
    }, []);

    const handleCallMade = useCallback(async (data: any) => {
        const { offer, from } = data;
        console.log("Call made from", from);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMyStream(stream);
        peerService.addTrack(stream);

        const answer = await peerService.getAnswer(offer);
        socket?.emit("make-answer", { answer, to: from });
        const remote = peerService.getRemoteStream();
        if (remote) setRemoteStream(remote);
    }, [socket]);

    const handleAnswerMade = useCallback(async (data: any) => {
        const { answer } = data;
        await peerService.setRemoteAnswer(answer);
        const remote = peerService.getRemoteStream();

        if (remote) setRemoteStream(remote);
    }, []);

    const handleNegotiationNeeded = useCallback(async ()=>{
        const offer = await peerService.getOffer();
        socket?.emit("make-offer",{offer,to:remoteSocketId});
    },[remoteSocketId,socket])

    const handleOfferMade = useCallback(async (data: any) => {
        const { offer, from } = data;
        await peerService.setRemoteOffer(offer);
        const answer = await peerService.getAnswer(offer);
        socket?.emit("make-answer", { answer, to: from });
        const remote = peerService.getRemoteStream();
        if (remote) setRemoteStream(remote);
    }, []);

    useEffect(() => {
        // Expose a method in peerService to add/remove event listeners safely
        peerService.addNegotiationNeededListener(handleNegotiationNeeded);
        return () => {
            peerService.removeNegotiationNeededListener(handleNegotiationNeeded);
        };
    }, [handleNegotiationNeeded]);

    // OPTIONAL: handle incoming ICE candidate
    const handleIceCandidate = useCallback((data: any) => {
        peerService.addIceCandidate(data.candidate);
    }, [])

    useEffect(() => {
        if (!socket) return;

        socket.on("user-joined", handleUserJoined);
        socket.on("call-made", handleCallMade);
        socket.on("answer-made", handleAnswerMade);
        socket.on("ice-candidate", handleIceCandidate);
        socket.on("offer-made", handleOfferMade);

        return () => {
            socket.off("user-joined", handleUserJoined);
            socket.off("call-made", handleCallMade);
            socket.off("answer-made", handleAnswerMade);
            socket.off("ice-candidate", handleIceCandidate);
            socket.off("offer-made", handleOfferMade);
        };
    }, [socket, handleUserJoined, handleCallMade, handleAnswerMade, handleIceCandidate, handleOfferMade]);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMyStream(stream);
        peerService.addTrack(stream);

        const offer = await peerService.getOffer();
        socket?.emit("call-user", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <div>
            <h1>Room</h1>
            <h4>{remoteSocketId ? "Connected to user" : "Waiting for user to join"}</h4>
            {remoteSocketId && (
                <button onClick={handleCallUser}>Call User</button>
            )}
            {myStream && (
                <div>
                    <h5>My Stream</h5>
                    <video
                        style={{ width: "300px", height: "200px", marginRight: "20px" }}
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
            {remoteStream && (
                <div>
                    <h5>Remote Stream</h5>
                    <video
                        style={{ width: "300px", height: "200px" }}
                        autoPlay
                        playsInline
                        ref={remoteVideoRef}
                    />
                </div>
            )}
        </div>
    );
}
