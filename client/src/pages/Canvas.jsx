import { useState, useEffect } from "react";
import { useDraw } from "../hooks/useDraw";
import { drawLine } from "../utils/drawLine";
import audioFile from "../utils/audio.mp3";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider.jsx";
import WebRTC from "../components/WebRTC.jsx";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Pencil, 
  Circle, 
  Square, 
  Trash2, 
  LogOut, 
  Download,
  Share2,
  Palette,
  Users,
  Copy
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";


const Canvas = () => {
  const [lineWidth, setLineWidth] = useState([5]);
  const [color, setColor] = useState("#000000");
  const [currShape, setCurrShape] = useState("line");
  const { canvasRef, onMouseDown, clear } = useDraw(createLine);

  const socket = useSocket();
  const { slug } = useParams();
  const navigate = useNavigate();

  const audio = new Audio(audioFile);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    socket.emit("join-room", slug);
    socket.on("clear-canvas", clear);
    socket.on("play-audio", () => { audio.play(); });
    socket.emit("client-ready", slug);

    socket.on("get-canvas-state", () => {
      if (!canvasRef.current?.toDataURL()) return;
      let currCanvasURL = canvasRef.current?.toDataURL();
      socket.emit("canvas-state", currCanvasURL, slug);
    });

    socket.on("canvas-state-from-server", (state) => {
      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
      };
    });

    socket.on("draw-line", ({ prevPoint, currentPoint, color, lineWidth }) => {
      if (!ctx) return;
      drawLine({ prevPoint, currentPoint, ctx, color, lineWidth });
    });

    return () => {
      socket.off("draw-line");
      socket.off("get-canvas-state");
      socket.off("canvas-state-from-server");
      socket.off("clear-canvas");
      socket.off("play-audio");
    };
  }, [canvasRef, slug, socket]);

  function createLine({ prevPoint, currentPoint, ctx }) {
    socket.emit("draw-line", {
      prevPoint,
      currentPoint,
      color,
      lineWidth: lineWidth[0],
      slug,
    });

    drawLine({
      prevPoint,
      currentPoint,
      ctx,
      color,
      lineWidth: lineWidth[0],
    });
  }

  const downloadCanvas = () => {
    const link = document.createElement("a");
    link.download = `sketch-${slug}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <TooltipProvider>

      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        {/* Main Workspace */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Refined Header */}
          <header className="h-16 bg-card/50 backdrop-blur-md border-b border-border flex items-center justify-between px-8 z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg text-primary-foreground shadow-lg shadow-primary/20">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-tight">Sketch Sync</h1>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Room: {slug}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 p-0 hover:bg-muted"
                          onClick={() => {
                            navigator.clipboard.writeText(slug);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Room ID</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              
              <Separator orientation="vertical" className="h-8 mx-2" />
              
              <div className="flex items-center gap-4 w-64">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest min-w-[32px]">Size</span>
                <Slider 
                  value={lineWidth} 
                  onValueChange={setLineWidth} 
                  max={30} 
                  min={1} 
                  step={1} 
                  className="w-full"
                />
                <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border border-border min-w-[28px] text-center">
                  {lineWidth[0]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ModeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9 px-4 font-semibold border-border bg-background/50" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}>
                    <Share2 className="w-4 h-4" /> Share
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy join link</TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/")} 
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exit Laboratory</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-12 bg-muted/30 relative group overflow-auto">
            <div className="relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] rounded-xl bg-background overflow-hidden border border-border ring-1 ring-black/5 dark:ring-white/5 transition-all duration-500">
              <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                width={900}
                height={700}
                className="cursor-crosshair"
              />
            </div>

            {/* Floating Toolbar (Dock Style) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
              <Card className="flex items-center gap-1.5 p-2 px-3 shadow-2xl border-border bg-card/95 backdrop-blur-xl rounded-2xl ring-1 ring-border transition-all">
                <ToggleGroup 
                  type="single" 
                  value={currShape} 
                  onValueChange={(val) => val && setCurrShape(val)}
                  className="gap-1"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="line" size="icon" className="h-10 w-10 text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl transition-all">
                        <Pencil className="w-5 h-5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Freehand Brush</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="rectangle" size="icon" className="h-10 w-10 text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl transition-all">
                        <Square className="w-5 h-5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Rectangle Tool</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="circle" size="icon" className="h-10 w-10 text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl transition-all">
                        <Circle className="w-5 h-5" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>Circle Tool</TooltipContent>
                  </Tooltip>
                </ToggleGroup>

                <Separator orientation="vertical" className="h-8 mx-1" />

                <div className="flex items-center gap-1">
                  <label htmlFor="colorPicker" className="cursor-pointer group relative">
                    <div 
                      className="w-10 h-10 rounded-xl border-2 border-border/50 shadow-inner group-hover:scale-105 transition-transform" 
                      style={{ backgroundColor: color }}
                    />
                    <input
                      id="colorPicker"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>

                <Separator orientation="vertical" className="h-8 mx-1" />

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => socket.emit("clear-canvas", slug)}
                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear Canvas</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={downloadCanvas}
                        className="h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export Sketch</TooltipContent>
                  </Tooltip>
                </div>
              </Card>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Participants */}
        <aside className="w-80 bg-card border-l border-border flex flex-col z-20 shadow-[-4px_0_24px_-8px_rgba(0,0,0,0.05)]">
          <div className="p-6 border-b border-border flex items-center justify-between bg-card/50">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm tracking-tight uppercase">Participants</h2>
            </div>
            {/* <Badge variant="secondary" className="px-2 font-mono h-5">4</Badge> */}
          </div>
          <div className="flex-1 overflow-hidden">
            <WebRTC />
          </div>
        </aside>
      </div>
    </TooltipProvider>
  );
};

export default Canvas;

