import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

function App() {
  const [loaded, setLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [transcodeComplete, setTranscodeComplete] = useState(false);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.9/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("progress", ({ progress, time }) => {
      if (messageRef.current)
        messageRef.current.innerHTML = `${progress * 100} % (transcoded time: ${time / 1000000} s)`;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'audio/x-m4a') {
      setSelectedFile(file);
      setTranscodeComplete(false)
    } else {
      alert('Please select a valid .m4a file');
    }
  };

  const transcode = async () => {
    if (!selectedFile) return;

    setTranscodeComplete(false); // Reset when starting new transcode
    const ffmpeg = ffmpegRef.current;
    const outputFileName = selectedFile.name.replace('.m4a', '.mp3');

    await ffmpeg.writeFile("input.m4a", await fetchFile(selectedFile));
    await ffmpeg.exec(["-i", "input.m4a", outputFileName]);
    const fileData = await ffmpeg.readFile(outputFileName);
    const data = new Uint8Array(fileData as ArrayBuffer);

    // Create the blob URL before setting transcodeComplete
    const audioBlob = new Blob([data.buffer], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);

    // Set transcodeComplete first, then update the audio src in the next tick
    setTranscodeComplete(true);

    // Use setTimeout to ensure the audio element is mounted
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      }
    }, 0);
  };


  return loaded ? (
    <>
      <div>
        <input
          type="file"
          accept=".m4a"
          onChange={handleFileSelect}
        />
        {selectedFile && <p>Selected file: {selectedFile.name}</p>}
      </div>
      {selectedFile &&
        <>
          {!transcodeComplete && <button onClick={() => void transcode()}>Transcode m4a to mp3</button>}
          <p ref={messageRef}></p>
          {transcodeComplete && (
            <>
              <audio ref={audioRef} controls></audio>
              <br />
              <button onClick={() => {
                if (audioRef.current?.src) {
                  const a = document.createElement('a');
                  a.href = audioRef.current.src;
                  a.download = selectedFile.name.replace('.m4a', '.mp3');
                  a.click();
                }
              }}>Download MP3</button>
            </>
          )}
          <br />
        </>
      }
    </>
  ) : (
    <button onClick={
      () => {
        void load();
      }
    }>Load ffmpeg-core</button>
  );
}

export default App;
