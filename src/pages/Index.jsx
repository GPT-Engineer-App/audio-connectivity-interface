import React, { useState, useRef, useEffect } from "react";
import { Button, Container, Text, VStack } from "@chakra-ui/react";

const Index = () => {
  const [status, setStatus] = useState("Disconnected");
  const [isRecording, setIsRecording] = useState(false);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const localStreamRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);

  const handleConnect = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    socketRef.current = new WebSocket("wss://media.agent4.ai/ZmUyNjljNTQtNzlkNS0xMWVlLWE3YTgtMGE1OGE5ZmVhYzAy/connect");
    socketRef.current.binaryType = "arraybuffer";

    socketRef.current.onopen = () => {
      setStatus("Connected");
    };

    socketRef.current.onmessage = async (event) => {
      const audioData = event.data;
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("Error");
    };

    socketRef.current.onclose = () => {
      setStatus("Disconnected");
      setIsRecording(false);
      setTimeout(handleConnect, 5000);
    };

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  };

  const handleRecord = async () => {
    if (!isRecording) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(localStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const inputBuffer = new Float32Array(inputData);
        const audioData = new Int16Array(inputBuffer.length);

        for (let i = 0; i < inputBuffer.length; i++) {
          audioData[i] = Math.min(1, inputBuffer[i]) * 0x7fff;
        }

        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(audioData.buffer);
        }
      };

      setIsRecording(true);
    } else {
      processorRef.current.disconnect();
      sourceRef.current.disconnect();
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setIsRecording(false);
    }
  };

  useEffect(() => {
    handleConnect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <Container centerContent maxW="container.md" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
      <VStack spacing={4}>
        <Button onClick={handleConnect} colorScheme="teal">
          Connect
        </Button>
        <Button onClick={handleRecord} colorScheme="red" disabled={status !== "Connected"}>
          {isRecording ? "Stop" : "Record"}
        </Button>
        <Text>Status: {status}</Text>
      </VStack>
    </Container>
  );
};

export default Index;
