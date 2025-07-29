import { useNavigate } from "react-router-dom";
import { Video, Users, Shield, Zap, ArrowRight, Play } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export default function Home() {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate("/join");
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
                    <Badge variant="secondary" className="hidden sm:flex">
                        Free • No Sign-up Required
                    </Badge>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-16">
                <div className="text-center max-w-5xl mx-auto">
                    <Badge variant="outline" className="mb-6">
                        <Play className="w-3 h-3 mr-1" />
                        Start in seconds
                    </Badge>
                    
                    <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
                        Connect instantly with
                        <span className="block bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent mt-2">
                            video calls that work
                        </span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                        Simple, fast, and reliable video calling. No downloads, no complicated setup. 
                        Just enter a room and start connecting with crystal-clear quality.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
                        <Button 
                            onClick={handleGetStarted}
                            size="lg"
                            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                            Start Meeting Now
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg"
                            className="text-lg px-8 py-6"
                        >
                            Learn More
                        </Button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 gap-8 mt-24">
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                            <CardHeader className="text-center pb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                                    <Zap className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Instant Connection</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <CardDescription className="text-base leading-relaxed">
                                    No registration required. Just share a room code and connect immediately 
                                    with anyone, anywhere in the world.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                            <CardHeader className="text-center pb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Easy to Use</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <CardDescription className="text-base leading-relaxed">
                                    Clean, intuitive interface designed for seamless video communication. 
                                    No learning curve required.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                            <CardHeader className="text-center pb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                                    <Shield className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Secure & Private</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <CardDescription className="text-base leading-relaxed">
                                    Your conversations stay private with peer-to-peer connections. 
                                    We don't store or record anything.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>

                    {/* How it works */}
                    <div className="mt-32">
                        <Badge variant="outline" className="mb-6">
                            How it works
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
                            Three simple steps to connect
                        </h2>
                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="text-center group">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    1
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-4">Enter Details</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Provide your email and create or join a room with a simple code
                                </p>
                            </div>
                            <div className="text-center group">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    2
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-4">Allow Access</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Grant camera and microphone permissions for the best experience
                                </p>
                            </div>
                            <div className="text-center group">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-3xl font-bold mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    3
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-4">Start Talking</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Enjoy high-quality video conversations instantly
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="mt-32">
                        <Card className="border-0 shadow-2xl bg-gradient-to-r from-primary/5 to-primary/10">
                            <CardContent className="p-12 text-center">
                                <h2 className="text-4xl font-bold text-foreground mb-4">
                                    Ready to connect?
                                </h2>
                                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                    Join thousands of people already using MeetNow for their video calls.
                                </p>
                                <Button 
                                    onClick={handleGetStarted}
                                    size="lg"
                                    className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    Get Started - It's Free
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="container mx-auto px-6 py-12 mt-32 border-t border-border/50">
                <div className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                            <Video className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-semibold">MeetNow</span>
                    </div>
                    <p>&copy; Made by Chandan C R</p>
                </div>
            </footer>
        </div>
    );
}