import jsQR from 'jsqr';

// 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
let inversionAttempts = 'dontInvert';
const grayscaleWeights = {
    // weights for quick luma integer approximation (https://en.wikipedia.org/wiki/YUV#Full_swing_for_BT.601)
    red: 77,
    green: 150,
    blue: 29,
    useIntegerApproximation: true,
};

function qrcode({ data, width, height }) {
    const rgbaData = data;
    return jsQR(rgbaData, width, height, {
        inversionAttempts,
        greyScaleWeights: grayscaleWeights,
    });
}

function setGrayscaleWeights(data) {
    Object.assign(grayscaleWeights, data);
}

function setInversionMode(inversionMode) {
    switch (inversionMode) {
        case 'original':
            inversionAttempts = 'dontInvert';
            break;
        case 'invert':
            // TODO mode 'onlyInvert' is currently broken in jsQR. Enable when fixed.
            inversionAttempts = 'attemptBoth';
            break;
        case 'both':
            inversionAttempts = 'attemptBoth';
            break;
        default:
            throw new Error('Invalid inversion mode');
    }
}

const msgIds = new Set();

function readBarcode({msgId, imgData}) {
    msgIds.add(msgId);
    const result = qrcode(imgData);
    self.postMessage({ msgId, result, isResult: true });
    msgIds.delete(msgId);
}

function close() {
    self.removeEventListener('message', handler);
    for(id of msgIds) {
        self.postMessage({ msgId, cancelled: true, isResult: true });
    }
}

const handler = evt => {
    if (evt.data.isResult) return;
    const type = evt.data.type;
    switch (type) {
        case 'barcode':
            return readBarcode(evt.data);
        case 'grayscale-weights':
            return setGrayscaleWeights(evt.data.weights);
        case 'inversion-mode':
            return setInversionMode(evt.data.mode);
        case 'close':
            return close();
        default:
            console.warn("Unknown QR Worker Message Type: " + type);
    }
};
self.addEventListener('message', handler);
