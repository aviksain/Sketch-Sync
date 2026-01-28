import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/Peer.js";
import { useSocket } from "../context/SocketProvider";
import { Button } from "@/components/ui/button";
import { PhoneCall, CheckCircle, Video, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WebRTC = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (!myStream) return;
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    const handleTrack = async (ev) => {
      const streams = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(streams[0]);
    };
    peer.peer.addEventListener("track", handleTrack);
    return () => {
      peer.peer.removeEventListener("track", handleTrack);
    };
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);


  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-card">
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-6">
            {/* Participant Status */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${remoteSocketId ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted animate-pulse"}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {remoteSocketId ? "Live Connection" : "Awaiting Peers"}
                </span>
              </div>
            </div>

            {/* Local Stream */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <Avatar className="h-8 w-8 ring-2 ring-background border border-border shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">YOU</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-none">Your Stream</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Local Source</p>
                </div>
              </div>
              
              <div className="relative group aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-inner">
                {myStream ? (
                  <ReactPlayer
                    playing
                    muted
                    height="100%"
                    width="100%"
                    url={myStream}
                    className="scale-x-[-1]" // Mirror local video
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 bg-muted/50">
                    <Video className="w-8 h-8 opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] backdrop-blur-md">Local</Badge>
                </div>
              </div>
            </div>

            {/* Remote Stream */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 px-2">
                <Avatar className="h-8 w-8 ring-2 ring-background border border-border shadow-sm">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-bold">RS</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-none">Remote Peer</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{remoteSocketId ? "Connected" : "Not available"}</p>
                </div>
              </div>

              <div className="relative group aspect-video rounded-xl overflow-hidden bg-muted border-2 border-primary/10 shadow-lg">
                {remoteStream ? (
                  <ReactPlayer
                    playing
                    muted
                    height="100%"
                    width="100%"
                    url={remoteStream}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 bg-muted/30">
                    <Users className="w-10 h-10 opacity-10" />
                  </div>
                )}
                {remoteSocketId && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 text-white border-0 text-[10px] shadow-lg shadow-green-500/20">LIVE</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Interaction Layer */}
            <div className="pt-4">
              {remoteSocketId && !myStream && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleCallUser} className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                      <PhoneCall className="w-4 h-4 mr-2" /> Initialize Visual Call
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start video and audio synchronization</TooltipContent>
                </Tooltip>
              )}
              {myStream && !remoteStream && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={sendStreams} variant="outline" className="w-full h-11 rounded-xl border-green-500/20 bg-green-500/5 text-green-600 hover:bg-green-500/10 transition-all active:scale-95">
                      <CheckCircle className="w-4 h-4 mr-2" /> Synchronize Stream
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Accept and share streams with peer</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </ScrollArea>
        
        {/* Call Footer Branding */}
        <div className="p-4 bg-muted/20 border-t border-border mt-auto">
          <p className="text-[10px] text-center font-bold text-muted-foreground tracking-widest uppercase opacity-50">Secure WebRTC Sync</p>
        </div>
      </div>
    </TooltipProvider>
  );
};


export default WebRTC;

