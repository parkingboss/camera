import QrWorker from 'web-worker:./qr-worker';
const qrWorker = new QrWorker();

import { getImageData, blobToImageData } from './image';

export async function detectBarcode(file) {
  const imgData = await blobToImageData(file);

  return await getBarcode(imgData);
}

export async function checkFrameForBarcode(video, state, opts) {
  const imgData = getImageData(video, state);

  if (imgData == null) return null;

  return await getBarcode(imgData);
}

function getBarcode(imgData) {
  return new Promise((resolve, reject) => {
    const msgId = Math.random();
    const handler = evt => {
      if (evt.data.msgId == msgId && evt.data.isResult) {
        if (evt.data.cancelled) {
          reject();
        } else {
          const bc = evt.data.result;
          resolve(bc && bc.data);
        }
        qrWorker.removeEventListener('message', handler);
      }
    };
    qrWorker.addEventListener('message', handler);
    qrWorker.postMessage({ type: 'barcode', msgId, imgData })
  })
}
