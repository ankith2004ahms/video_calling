class PeerService {
    private peer: RTCPeerConnection | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
    private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;
    private isInitializing: boolean = false;
    private pendingIceCandidates: RTCIceCandidateInit[] = [];
    private remoteDescriptionSet: boolean = false;

    constructor() {
        this.initializePeer();
    }

    private initializePeer() {
        if (this.isInitializing) return;
        this.isInitializing = true;

        if (this.peer) {
            this.peer.close();
        }

        this.peer = new RTCPeerConnection({
            iceServers: [
                { urls: ["stun:stun.l.google.com:19302"] }
            ]
        });

        // Set up ontrack event handler
        this.peer.ontrack = (event) => {
            
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }
            
            // Add the track to remote stream
            event.streams[0].getTracks().forEach(track => {
                this.remoteStream!.addTrack(track);
            });
            
            // Notify the component about the new remote stream
            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(this.remoteStream);
            }
        };

        this.peer.onconnectionstatechange = () => {
            if (!this.peer) return;
            
            const state = this.peer.connectionState;
            
            // Only reinitialize on failed state, not on normal disconnection
            if (state === "failed") {
                console.warn("⚠️ Peer connection failed, reinitializing...");
                setTimeout(() => {
                    this.initializePeer();
                }, 1000);
            }
        };

        // Add ICE candidate event handler
        this.peer.onicecandidate = (event) => {
            if (event.candidate) {
                // This should be emitted to the remote peer via socket
                if (this.onIceCandidateCallback) {
                    this.onIceCandidateCallback(event.candidate);
                }
            }
        };

        this.isInitializing = false;
    }

    // Method to set callback for remote stream updates
    setOnRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
    }

    // Method to set callback for ICE candidates
    setOnIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
        this.onIceCandidateCallback = callback;
    }

    private isConnectionValid(): boolean {
        return this.peer !== null && 
               this.peer.signalingState !== 'closed' && 
               this.peer.connectionState !== 'closed';
    }

    addTrack(stream: MediaStream) {
        if (!this.isConnectionValid()) {
            console.warn("Cannot add track: peer connection is not valid");
            this.initializePeer();
            return;
        }

        const existingSenders = this.peer!.getSenders();
        
        stream.getTracks().forEach((track) => {
            // Check if track is already added
            const existingSender = existingSenders.find(sender => 
                sender.track && sender.track.id === track.id
            );
            
            if (!existingSender) {
                try {
                    this.peer!.addTrack(track, stream);
                } catch (error) {
                    console.error("Error adding track:", error);
                    // Reinitialize peer connection if it's in an invalid state
                    this.initializePeer();
                }
            }
        });
    }

    async getOffer(): Promise<RTCSessionDescriptionInit | null> {
        if (!this.isConnectionValid()) {
            console.warn("Cannot create offer: peer connection is not valid");
            this.initializePeer();
            return null;
        }

        try {
            const offer = await this.peer!.createOffer();
            await this.peer!.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error("Error creating offer:", error);
            return null;
        }
    }

    async getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
        if (!this.isConnectionValid()) {
            console.warn("Cannot create answer: peer connection is not valid");
            this.initializePeer();
            return null;
        }

        try {
            await this.peer!.setRemoteDescription(new RTCSessionDescription(offer));
            this.remoteDescriptionSet = true;
            
            const answer = await this.peer!.createAnswer();
            await this.peer!.setLocalDescription(answer);
            
            // Process any pending ICE candidates
            await this.processPendingIceCandidates();
            
            return answer;
        } catch (error) {
            console.error("Error creating answer:", error);
            return null;
        }
    }

    async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
        if (!this.isConnectionValid()) {
            console.warn("Cannot set remote answer: peer connection is not valid");
            return;
        }

        try {
            await this.peer!.setRemoteDescription(new RTCSessionDescription(answer));
            this.remoteDescriptionSet = true;
            
            // Process any pending ICE candidates
            await this.processPendingIceCandidates();
        } catch (error) {
            console.error("Error setting remote answer:", error);
        }
    }

    async setRemoteOffer(offer: RTCSessionDescriptionInit) {
        if (!this.isConnectionValid()) {
            console.warn("Cannot set remote offer: peer connection is not valid");
            return;
        }

        try {
            await this.peer!.setRemoteDescription(new RTCSessionDescription(offer));
            this.remoteDescriptionSet = true;
            
            // Process any pending ICE candidates
            await this.processPendingIceCandidates();
        } catch (error) {
            console.error("Error setting remote offer:", error);
        }
    }

    private async processPendingIceCandidates() {
        for (const candidate of this.pendingIceCandidates) {
            try {
                await this.peer!.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Error adding pending ICE candidate:", error);
            }
        }
        this.pendingIceCandidates = [];
    }

    addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.isConnectionValid()) {
            console.warn("Cannot add ICE candidate: peer connection is not valid");
            return;
        }

        if (!this.remoteDescriptionSet) {
            this.pendingIceCandidates.push(candidate);
            return;
        }

        try {
            this.peer!.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("Added ICE candidate immediately");
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }

    getRemoteStream(): MediaStream | null {
        return this.remoteStream;
    }

    addNegotiationNeededListener(callback: () => void) {
        if (this.isConnectionValid()) {
            this.peer!.addEventListener('negotiationneeded', callback);
        }
    }

    removeNegotiationNeededListener(callback: () => void) {
        if (this.peer) {
            this.peer.removeEventListener('negotiationneeded', callback);
        }
    }

    // Clean up method
    cleanup() {
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }
        if (this.peer && this.peer.signalingState !== 'closed') {
            this.peer.close();
        }
        this.peer = null;
        this.onRemoteStreamCallback = null;
        this.onIceCandidateCallback = null;
        this.remoteDescriptionSet = false;
        this.pendingIceCandidates = [];
    }

    // Reset peer connection (useful for starting fresh)
    reset() {
        this.cleanup();
        this.initializePeer();
    }
}

export default new PeerService();