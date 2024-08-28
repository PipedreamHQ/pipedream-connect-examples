"use client"

import { Chat } from "@/components/chat/chat";
import { useRef, useState } from "react";

export default function Page() {
  const dividerRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(500); // Initial width of the left pane

  const handleMouseDown = () => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const newLeftWidth = e.clientX;
    setLeftWidth(newLeftWidth);
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="flex h-screen">
      <div
        style={{ width: leftWidth }}
        className="flex-shrink-0 overflow-hidden"
      >
        <div className="h-full overflow-y-auto">
          <Chat />
        </div>
      </div>
      <div
        ref={dividerRef}
        onMouseDown={handleMouseDown}
        className="w-[5px] cursor-col-resize bg-gray-300"
      />
      <div className="flex-1 overflow-y-auto">
        Generated component goes here
      </div>
    </div>
  );
}
