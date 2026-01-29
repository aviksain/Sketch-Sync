import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { generate } from "../utils/roomNoGenerator.js";
import { useSocket } from "../context/SocketProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, RefreshCw, Palette } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

const Login = () => {
  const [roomNumber, setRoomNumber] = useState("");
  const [name, setName] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    setCopySuccess(false);
  }, [roomNumber]);

  const generateNo = () => {
    setRoomNumber(generate());
  };

  const handleCopy = () => {
    if (!roomNumber) return;
    navigator.clipboard.writeText(roomNumber);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && roomNumber) {
      socket.emit("client-connect", { name, roomNumber });
    }
  };

  const handleJoinRoom = useCallback((data) => {
    const { roomNumber } = data;
    navigate(`/${roomNumber}`);
  },[navigate]);

  useEffect(() => {
    socket.on("client-connect", handleJoinRoom);

    return () => socket.off("client-connect", handleJoinRoom);
  }, [socket, handleJoinRoom]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-border bg-card/50 backdrop-blur-sm z-10 transition-all duration-300 hover:shadow-primary/5">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary ring-1 ring-primary/20 shadow-inner">
              <Palette className="w-10 h-10" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Sketch Sync</CardTitle>
          <CardDescription className="text-base">
            Real-time collaborative canvas for modern teams
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="name" className="text-sm font-semibold ml-1">Your Name</Label>
              <Input
                id="name"
                placeholder="How should we call you?"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-background/50 border-border focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="roomNumber" className="text-sm font-semibold ml-1">Room Identity</Label>
              <div className="flex gap-2">
                <Input
                  id="roomNumber"
                  placeholder="Enter or generate a unique ID"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="h-11 bg-background/50 border-border focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="h-11 w-11 shrink-0"
                  title="Copy Room ID"
                  disabled={!roomNumber}
                >
                  <Copy className={`w-4 h-4 ${copySuccess ? "text-green-500" : ""}`} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateNo}
                  className="h-11 w-11 shrink-0"
                  title="Generate ID"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 pb-8">
            <Button 
              type="submit" 
              className="w-full text-lg h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[0px]" 
              disabled={!name || !roomNumber}
            >
              Join Collaboration
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground z-10">
        Built with Shadcn UI & Socket.io
      </p>
    </div>
  );
}


export default Login;

