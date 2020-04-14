# @parkingboss/camera

Ever wish there was an html element you could use to show video from your web cams? Capture frames from your web cams? Detect a barcode? Wish no more.

## Styles:

Only rule here is that the video element should be styled with `object-fit: cover`. We do not provide styles at this time.

## Usage

 1. Install: `npm install @parkingboss/camera`
 2. Import: `import Camera from '@parkingboss/camera'`
 3. Use: `new Camera({ target: el, props: { flashlight: disable, barcode: true } });`
 4. Only want the barcode detection? `import { detectBarcode } from '@parkingboss/camera'`.

The component is created by svelte, so it uses the [Component API](https://svelte.dev/docs#Client-side_component_API).

### Props

If you're not using svelte you can change these with the `$set` function. E.g. `cam.$set({ barcode: true })`.

 * `barcode`: (boolean, leave off or truthy). If true, checks frames for barcodes.
 * `flashlight`: `false | 'disable'`. Set to false to hide flashlight button. Set to 'disable' to show the flashlight button, but disable it.
 * `capture`: `false | 'disable'`. Set to false to hide capture button. Set to 'disable' to show the capture button, but disable it.
 * `freeze`: number, seconds to freeze the frame after a capture. Default 2. The
   image will display on screen, and then fade out quickly after the freeze time
   is up.
 * `navigating`: boolean, default false. On iOS in
   standalone mode, or in a Browser View in an App,
   navigating to a different route requires re-aquiring
   a new MediaStream. If you set this to true when
   navigating then this component will handle
   reacquiring the stream on your behalf when navigation is complete. Using page.js something like this would work:

```
page('*', () => cam.$set({ navigating: true }));
page.exit('*', () => cam.$set({ navigating: false }));
```

The `'*'` is strictly optional, but slightly more explicit.

### Slots

This lets you override the content of the flashlight and capture buttons with some other element. It does not appear like you can use this functionality from pure javascript. You definitely can with svelte. If this _is_ possible please issue a PR.

```
<Camera>
  <span slot=flashlight>Torch</span>
</Camera>
```

 * Named: 'flashlight', the contents of the flashlight `<button>`.
 * Named: 'capture', the contents of the capture `<button>`.

### Events

Events can be subscribed to using svelte, or using the `$on` function. If using `$on` the function returns the 'unsubscribe' function that can be called to stop listening for events.

 * `'image', { image: Blob }`
   When an image is captured this event fires with the blob captured.

 * `'barcode', { result: string | null, image: Blob }`
   When a barcode is detected in a frame or file this event fires with
   the result field as the string encoded, and the image a promise of
   the image where the result was found.

### Functions

If you want to, you can hide the controls entirely and rely on external controls and the functions exported by the component. This works in both svelte and javascript:

 * `capture(): Promise<Blob>`
 * `barcode(): Promise<{ result: string | null, image: Promise<Blob> }>`

Here's how this would look in javascript:

```
const cam = new Camera({ target: el, props: {} });

cam.capture().then(image => {
  sendImage(image);
});

cam.barcode().then(({ result, image }) => {
  image.then(p => {
    if (result) {
      sendImageAndBarcode(p, result);
    }
  });
});
```

With a `bind` directive in svelte (`<Camera bind:this={cam} />`) you can use the same API in your parent components.

## Detect Barcode

The `detectBarcode` function accepts a Blob and returns a promise of a result and the blob itself.