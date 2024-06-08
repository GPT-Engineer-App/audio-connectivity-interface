# audio-connectivity-interface

Prompt for GPT Engineer:

I want to build a full-duplex audio interface that communicates with the WebSocket URL wss://media.agent4.ai/ZmUyNjljNTQtNzlkNS0xMWVlLWE3YTgtMGE1OGE5ZmVhYzAy/connect. Here are the detailed requirements:

User Interface:

Create a button labeled "Connect" to open the WebSocket connection.
Create a button labeled "Record" to start the audio recording and streaming.
Ensure the UI displays the current status (e.g., "Connected", "Recording").
WebSocket Connection:

Open a WebSocket connection to the provided URL when the "Connect" button is pressed.
Maintain the WebSocket connection for the entire session.
Audio Handling:

Use navigator.mediaDevices.getUserMedia to capture audio from the microphone.
Stream audio data to the WebSocket while the "Record" button is pressed.
Ensure audio data received from the WebSocket is played back, except the local microphone audio to avoid feedback.
Full-Duplex Communication:

Implement logic to handle sending and receiving audio data simultaneously.
Ensure the application doesn't hear its own audio to avoid echo.
Error Handling:

Add error handling to manage WebSocket connection issues and media device access errors.
Here's the step-by-step implementation plan and the required code:

Step 1: Create the User Interface
javascript
Copy code
<!DOCTYPE html>
<html>
<head>
    <title>Full-Duplex Audio Interface</title>
</head>
<body>
    <button id="connect">Connect</button>
    <button id="record" disabled>Record</button>
    <div id="status">Status: Disconnected</div>

    <script src="app.js"></script>
</body>
</html>
Step 2: Implement the JavaScript Logic
javascript
Copy code
let socket;
let localStream;
let mediaRecorder;
let audioContext;
let source;
let processor;
let audioChunks = [];

document.getElementById('connect').onclick = async () => {
    socket = new WebSocket('wss://media.agent4.ai/ZmUyNjljNTQtNzlkNS0xMWVlLWE3YTgtMGE1OGE5ZmVhYzAy/connect');
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => {
        document.getElementById('status').innerText = 'Status: Connected';
        document.getElementById('record').disabled = false;
    };

    socket.onmessage = (event) => {
        const audioData = event.data;
        const audioBuffer = audioContext.decodeAudioData(audioData, (buffer) => {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start(0);
        });
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
        document.getElementById('status').innerText = 'Status: Error';
    };

    socket.onclose = () => {
        document.getElementById('status').innerText = 'Status: Disconnected';
        document.getElementById('record').disabled = true;
    };

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
};

document.getElementById('record').onclick = async () => {
    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        source = audioContext.createMediaStreamSource(localStream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const inputBuffer = new Float32Array(inputData);
            const audioData = new Int16Array(inputBuffer.length);

            for (let i = 0; i < inputBuffer.length; i++) {
                audioData[i] = Math.min(1, inputBuffer[i]) * 0x7FFF;
            }

            if (socket.readyState === WebSocket.OPEN) {
                socket.send(audioData.buffer);
            }
        };

        document.getElementById('record').innerText = 'Stop';
    } else {
        processor.disconnect();
        source.disconnect();
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
        document.getElementById('record').innerText = 'Record';
    }
};
Key Changes and Additions:
WebSocket Connection: Establish and maintain a connection, handle incoming messages.
Media Stream: Capture and process audio, send data through WebSocket.
Full-Duplex Logic: Ensure the application can send and receive audio simultaneously, avoid local audio feedback.
UI Updates: Update the status and button states based on the WebSocket connection and recording state.
With this setup, pressing "Connect" will establish the WebSocket connection, and pressing "Record" will start capturing and streaming audio. Pressing "Record" again will stop the audio capture.

## Collaborate with GPT Engineer

This is a [gptengineer.app](https://gptengineer.app)-synced repository 🌟🤖

Changes made via gptengineer.app will be committed to this repo.

If you clone this repo and push changes, you will have them reflected in the GPT Engineer UI.

## Tech stack

This project is built with React and Chakra UI.

- Vite
- React
- Chakra UI

## Setup

```sh
git clone https://github.com/GPT-Engineer-App/audio-connectivity-interface.git
cd audio-connectivity-interface
npm i
```

```sh
npm run dev
```

This will run a dev server with auto reloading and an instant preview.

## Requirements

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
