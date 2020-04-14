import { writable } from 'svelte/store';
import { getImageData, imageDataToBlob } from './image';
import { checkFrameForBarcode } from './barcode';

async function webcamExists() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return devices.some(device => device.kind === 'videoinput');
  } catch (err) {
    return false;
  }
}

async function makeStream(width) {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width },
      audio: false,
    });
  } catch (err) {
    return null;
  }
}

const resolutions = [1920, 1280, 1024, 960, 800, 768];

async function getStream() {
  for (const width of resolutions) {
    const stream = await makeStream(width);
    if (stream) return stream;
  }
  return await makeStream();
}

function torchState(track) {
  return track.getSettings().torch;
}

function hasTorch(track) {
  try {
    const capabilities = track.getCapabilities();
    return capabilities.torch;
  } catch (err) {
    return false;
  }
}

export async function Camera(videoEl) {
  if (!await webcamExists()) {
    throw new Error("Could not find a webcam device.");
  }

  const stream = await getStream();
  if (!stream) {
    throw new Error("Could not capture a Media Stream from the webcam.");
  }

  const track = stream.getVideoTracks()[0];
  if (!track) {
    throw new Error("Could not find a video track for the Media Stream.");
  }

  const flashlight = hasTorch(track) ? writable(torchState(track)) : null;

  const stopFlashlight = flashlight && flashlight.subscribe(newState => {
    const actualState = torchState(track);
    if (actualState != newState) {
      track.applyConstraints({ advanced: [{ torch: newState }] })
        .then(() => flashlight.set(torchState(track)))
        .catch(() => flashlight.set(false));
    }
  });

  const canvas = document.createElement('canvas');

  const context = canvas.getContext('2d');

  if (context == null) {
    throw new Error("Could not capture a canvas context.");
  }

  const state = {
    videoSize: null,
    canvas,
    context,
  };
  const onResize = () => { state.videoSize = null };
  document.addEventListener('resize', onResize);

  return {
    stream,

    track,

    flashlight,

    resized() {
      videoSize = null;
    },

    lookForBarcodes(handler, opts) {
      let cancelled = false;

      setTimeout(async () => {
        while (true) {
          if (cancelled) break;

          const [result, imgData] = await checkFrameForBarcode(video, state, opts);

          if (result) {
            const image = await imageDataToBlob(imgData, opts);
            await Promise.result(handler({ result, image }));
          }

          await wait(result ? 0 : 300);
        }
      }, 0);

      return function stopLooking() {
        cancelled = true;
      };
    },

    async capture(settings) {
      const imageData = getImageData(video, state);

      return await imageDataToBlob(imageData, settings);
    },

    remove() {
      if (flashlight) stopFlashlight();
      document.removeEventListener('resize', onResize);
      video.pause();
      stream.getVideoTracks().forEach(vt => vt.stop());
    },
  }
}
