import { useState, useCallback, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import { Video, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Lobby() {
    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const socket = useSocket();
    const navigate = useNavigate();

    const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email.trim() || !room.trim()) return;
        
        setIsLoading(true);
        socket?.emit("join-room", { email: email.trim(), room: room.trim() });
    }, [email, room, socket]);

    const handleJoinRoom = useCallback((data: any) => {
        const { email, room } = data;
        setEmail(email);
        setRoom(room);
        setIsLoading(false);
        navigate(`/room?room=${room}`);
    }, [setEmail, setRoom, navigate]);

    useEffect(() => {
        if (socket) {
            socket.on("joined-room", handleJoinRoom);
            return () => {
                socket.off("joined-room", handleJoinRoom);
            };
        }
    }, [socket, handleJoinRoom]);

    const goBack = () => {
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
            {/* Header */}
            <header className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                            <Video className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                            MeetNow
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        className="flex items-center space-x-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6">
                <div className="max-w-md mx-auto">
                    <Card className="border-0 shadow-2xl">
                        <CardHeader className="text-center pb-6">
                            <Badge variant="outline" className="w-fit mx-auto mb-4">
                                Join Meeting
                            </Badge>
                            <CardTitle className="text-3xl font-bold">Almost there!</CardTitle>
                            <CardDescription className="text-base">
                                Enter your details to start or join a video call
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-8 pb-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email Address
                                    </Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="h-12 text-base"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="room">
                                        Room Code
                                    </Label>
                                    <Input
                                        type="text"
                                        id="room"
                                        value={room}
                                        onChange={(e) => setRoom(e.target.value)}
                                        placeholder="Enter room code (e.g., my-meeting)"
                                        className="h-12 text-base"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !email.trim() || !room.trim()}
                                    className="w-full py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Joining Meeting...
                                        </>
                                    ) : (
                                        "Join Meeting"
                                    )}
                                </Button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-border/50">
                                <div className="text-center">
                                    <Badge variant="secondary" className="mb-3">
                                        💡 Pro Tip
                                    </Badge>
                                    <p className="text-sm text-muted-foreground">
                                        Don't have a room code? Just create one by entering any unique name above.
                                        Share it with others to invite them to your meeting!
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}