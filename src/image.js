const DEFAULT_SETTINGS = {
  type: 'image/jpeg',
  jpegDetails: 0.45,
};

// Convert from an ImageData object (raw image) to a Blob which can be set as a
// url and is Serializable for inter-domain transfer via postMessage
export function imageDataToBlob(data, imgSettings = {}) {
  const { type, jpegDetails } = Object.assign({}, DEFAULT_SETTINGS, imgSettings);

  return new Promise((resolve, reject) => {
    const c = document.createElement('canvas');
    c.height = data.height;
    c.width = data.width;

    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.putImageData(data, 0, 0);
      c.toBlob(b => b ? resolve(b) : reject('failed to convert image'), type, jpegDetails);
    } else {
      reject('Failed to get 2d context');
    }
  });
}

export function blobToImageData(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = evt => {
      URL.revokeObjectURL(img.src);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
      img.onload = null;
      img.onerror = null;
    };
    img.onerror = evt => {
      reject();
      img.onload = null;
      img.onerror = null;
    };

    img.src = url;
  });
}

// Get ImageData from video, state, and either `'source'` or `'screen'` string
// option. If `source` it will return the size as captured. if `screen` it will
// return the image in the size as shown on screen (usually much smaller)
export function getImageData(video, state) {
  if (drawFrame(video, state)) {
    return state.context.getImageData(0, 0, state.canvas.width, state.canvas.height);
  }
  return null;
}

// Draw the current video frame to the state's canvas
function drawFrame(video, state) {
  const videoSize = getVideoSize(video, state);

  if (!videoSize) return false;

  const { sx, sy, sw, sh, dx, dy, dh, dw } = videoSize;

  state.canvas.height = dh;
  state.canvas.width = dw;

  state.context.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);

  return true;
}

// Get the video size, prefer cached
function getVideoSize(video, state) {
  if (!state.sizeCache) {
    state.sizeCache = calcVideoSize(video);
  }
  return getCapturedArea(state.sizeCache);
}

// Calculate the video size. Don't touch this. It was tricky
function calcVideoSize(video) {
  const { videoHeight, videoWidth } = video;
  const { height, width } = video.getBoundingClientRect();

  if (videoHeight === 0 || videoWidth === 0 || height === 0 || width === 0) {
    return null;
  }

  const canvasRatio = width / height;
  const videoRatio = videoWidth / videoHeight;
  const [sw, sh] = canvasRatio < videoRatio
    ? [width * videoHeight / height, videoHeight]
    : [videoWidth, height * videoWidth / width];

  return {
    sx: (videoWidth - sw) / 2,
    sy: (videoHeight - sh) / 2,
    sw,
    sh,
    dx: 0,
    dy: 0,
    dw: sw,
    dh: sh,
  };
}

function getCapturedArea(sizeCache) {
  if (sizeCache == null) return null;

  const { sx, sy, sw, sh, dx, dy, dh, dw } = sizeCache;
  const isVertical = sh > sw;
  const width = isVertical
    ? sw
    : 1 * sh;
  const height = isVertical
    ? 1 * sw
    : sh;
  const uncapturedWidth = sw - width;
  const uncapturedHeight = sh - height;

  return {
    sx: sx + (uncapturedWidth * .5),
    sy: sy + (uncapturedHeight * .5),
    sw: width,
    sh: height,
    dx: 0,
    dy: 0,
    dw: width,
    dh: height,
  };
}
