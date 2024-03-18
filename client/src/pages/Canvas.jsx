import { useState, useEffect } from "react";
import { useDraw } from "../hooks/useDraw";
import { drawLine } from "../utils/drawLine";
import audioFile from "../utils/audio.mp3";
import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketProvider.jsx";
import WebRTC from "../components/WebRTC.jsx";

const Canvas = ({}) => {
  const [lineWidth, setLineWidth] = useState(20);
  const [color, setColor] = useState("#000");
  const [currShape, setCurrShape] = useState("line");
  const { canvasRef, onMouseDown, clear } = useDraw(createLine);

  const socket = useSocket();
  let { slug } = useParams();

  const audio = new Audio(audioFile);

  const handleShapeChange = (e) => {
    setCurrShape(e.target.value);
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");

    socket.emit("join-room", slug);

    socket.on("clear-canvas", clear);

    socket.on("play-audio", () => {
      audio.play();
    });

    socket.emit("client-ready", slug);

    socket.on("get-canvas-state", () => {
      if (!canvasRef.current?.toDataURL()) return;
      console.log("sending canvas state");
      let currCanvasURL = canvasRef.current?.toDataURL();
      socket.emit("canvas-state", currCanvasURL, slug);
    });

    socket.on("canvas-state-from-server", (state) => {
      console.log("I received the state");
      const img = new Image();
      img.src = state;
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
      };
    });

    socket.on("draw-line", ({ prevPoint, currentPoint, color, lineWidth }) => {
      if (!ctx) return console.log("no ctx here");
      drawLine({ prevPoint, currentPoint, ctx, color, lineWidth });
    });

    return () => {
      socket.off("draw-line");
      socket.off("get-canvas-state");
      socket.off("canvas-state-from-server");
      socket.off("clear-canvas");
      socket.off("play-audio");
    };
  }, [canvasRef]);

  function createLine({ prevPoint, currentPoint, ctx }) {
    socket.emit("draw-line", {
      prevPoint,
      currentPoint,
      color,
      lineWidth,
      slug,
    });

    drawLine({
      prevPoint,
      currentPoint,
      ctx,
      color,
      lineWidth,
    });
  }

  return (
    <>
      <div className="flex justify-center items-center">
        <div className="w-screen h-screen bg-white flex justify-around items-center">
          <div className="pt-10 h-screen flex flex-col gap-10 pr-10 bg-white items-center">
            {/* <ChromePicker color={color} onChange={(e) => setColor(e.hex)} /> */}
            <input
              color={color}
              onChange={(e) => setColor(e.target.value)}
              type="color"
              id="colorPicker"
              name="colorPicker"
            />
            <button
              type="button"
              className="p-2 rounded-md border border-black"
              onClick={() => socket.emit("clear-canvas", slug)}
            >
              Clear canvas
            </button>
            <input
              type="range"
              min="4"
              max="30"
              value={lineWidth}
              onChange={(e) => {
                setLineWidth(e.target.value);
              }}
            />

            <ul>
              <li
                className={`${
                  currShape == "rectangle" ? "bg-yellow-700 rounded " : ""
                } text-center`}
              >
                <input
                  id="rectangle"
                  type="radio"
                  value="rectangle"
                  checked={currShape === "rectangle"}
                  onChange={handleShapeChange}
                  className="hidden"
                />
                <label className="rounded-lg text-2xl" htmlFor="rectangle">
                  Rectangle
                </label>
              </li>
              <li
                className={`${
                  currShape == "circle" ? "bg-yellow-700 rounded" : ""
                } text-center`}
              >
                <input
                  id="circle"
                  type="radio"
                  value="circle"
                  checked={currShape === "circle"}
                  onChange={handleShapeChange}
                  className="hidden"
                />
                <label className="rounded-lg text-2xl " htmlFor="circle">
                  Circle
                </label>
              </li>
              <li
                className={`${
                  currShape == "line" ? "bg-yellow-700 rounded" : ""
                } text-center`}
              >
                <input
                  id="line"
                  type="radio"
                  value="line"
                  checked={currShape === "line"}
                  onChange={handleShapeChange}
                  className="hidden"
                />
                <label className="rounded-lg text-2xl" htmlFor="line">
                  Line
                </label>
              </li>
            </ul>
          </div>
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            width={730}
            height={730}
            className="border border-black rounded-md"
          />
        </div>
        <div className="h-screen w-96">
          <WebRTC/>
        </div>

        {/* <nav class="w-96 right-0 pb-2 bg-black border-l border-gray-300 xl:block"></nav> */}
      </div>
    </>
  );
};

export default Canvas;
