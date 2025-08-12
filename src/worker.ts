/// <reference lib="webworker" />
import { ImageToTextPipeline, pipeline, type ProgressCallback } from '@huggingface/transformers';

let captionerPromise: Promise<ImageToTextPipeline>; // Singleton instance for the pipeline

// Singleton function to initialize or return the existing pipeline instance
const getCaptioner = async () => {
    if (!captionerPromise) {
        // @ts-ignore
        captionerPromise = pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', { progress_callback });
    }
    return captionerPromise;
};

const progress_callback: ProgressCallback = function (args) {
    self.postMessage(args);
};

self.onmessage = async (e: MessageEvent) => {
    if (!e.data) {
        return;
    }
    const captioner = await getCaptioner();

    self.postMessage({ status: 'generating' });
    const output = await captioner(e.data);

    self.postMessage({ ...output[0], status: 'complete' });
};
