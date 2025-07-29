class PeerService {
    private peer: RTCPeerConnection;
    private remoteStream: MediaStream | null = null;

    constructor() {
        this.peer = new RTCPeerConnection({
            iceServers: [
                { urls: ["stun:stun.l.google.com:19302"] }
            ]
        });
        this.peer.ontrack = (event) => {
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }
            this.remoteStream.addTrack(event.track);
        };
        this.peer.onconnectionstatechange = () => {
            const state = this.peer.connectionState;
            if (state === "disconnected" || state === "failed" || state === "closed") {
                console.warn("⚠️ Peer connection lost:", state);
        
                if (this.remoteStream) {
                    this.remoteStream.getTracks().forEach((track) => track.stop());
                    this.remoteStream = null;   
                }
        
                this.peer.close();
                this.reinitializePeer();

        
            }
        };
    }
    reinitializePeer(){
        this.peer = new RTCPeerConnection({
            iceServers: [
                { urls: ["stun:stun.l.google.com:19302"] }
            ]
        });
    }

    addTrack(stream: MediaStream) {
        stream.getTracks().forEach((track) => {
            this.peer.addTrack(track, stream);
        });
    }

    async getOffer(): Promise<RTCSessionDescriptionInit> {
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(offer);
        return offer;
    }

    async getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
        await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        return answer;
    }

    async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
        await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async setRemoteOffer(offer: RTCSessionDescriptionInit) {
        await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    }

    addIceCandidate(candidate: RTCIceCandidateInit) {
        this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    addNegotiationNeededListener(callback: () => void) {
        this.peer.addEventListener('negotiationneeded', callback);
    }

    removeNegotiationNeededListener(callback: () => void) {
        this.peer.removeEventListener('negotiationneeded', callback);
    }
}

export default new PeerService();
