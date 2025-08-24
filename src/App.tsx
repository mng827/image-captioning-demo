import { useEffect, useRef, useState } from 'react'
import MyWorker from './worker?worker&inline';
import './App.css'
import Progress, { type ProgressProps } from './Progress';

interface ImageUploadEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement & { files: FileList };
}


function App() {
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progressItems, setProgressItems] = useState<ProgressProps[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Only create the worker once
    if (!workerRef.current) {
      workerRef.current = new MyWorker({ type: 'module' } as WorkerOptions);
    }
    const worker = workerRef.current;

    worker.onmessage = (e: MessageEvent) => {

      switch (e.data.status) {
        case 'initiate':
          // Model file start load: add a new progress item to the list.
          setStatus('Downloading model files...');
          setProgressItems(prev => [...prev, { text: e.data.file, percentage: 0 }]);
          break;

        case 'progress':
          // Model file progress: update one of the progress items.
          setProgressItems(
            prev => prev.map(item => {
              if (item.text === e.data.file) {
                return { ...item, percentage: e.data.progress }
              }
              return item;
            })
          );
          break;

        case 'done':
          setProgressItems(
            prev => prev.filter(item => item.text !== e.data.file)
          );
          break;

        case 'ready':
          setStatus('Ready');
          break;

        case 'generating':
          setStatus('Generating...');
          setResult(null);
          break;

        case 'complete':
          setStatus('Ready');
          setResult(e.data.generated_text);
          break;
      }
    };

    worker.postMessage(imageFile);

    return () => { };
  }, [imageFile]);

  const handleImageUpload = (event: ImageUploadEvent): void => {
      const file: File | null = event.target.files[0];
      if (file) {
          setImageFile(URL.createObjectURL(file)); // Create a preview URL for the video
      }
  };

  return (
    <div>
      <h1>Image Captioning Demo</h1>

      <label htmlFor="file-upload" className="file-label">
        📁 Choose file
      </label>
      <input id="file-upload" className="file-input" type="file" accept="image/*" onChange={handleImageUpload}/>

      <p>Status: {status}</p>

      {progressItems.map(data => (
          <div key={data.text}>
            <Progress text={data.text} percentage={data.percentage} />
          </div>
      ))}

      <p>Description: {result}</p>

      {imageFile && (
        <div>
          <br />
          <img src={imageFile} style={{ width: '500px', height: 'auto' }} />
        </div>
      )}

    </div>
  )
}

export default App
