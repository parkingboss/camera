<script>
  import { onMount } from 'svelte';
  import { createDispatchers } from './dispatch';
  import { Camera } from './camera';

  const fire = createDispatchers('image', 'barcode', 'processing', 'failed');

  export let freeze;
  export let barcode;
  export let flashlight;
  export let capture;

  let flashlightState = false;

  let camera = null,
    videoEl = null;

  $: if (camera) setBarcodeMode(barcode);

  let stopBarcodes = null;
  function setBarcodeMode(mode) {
    if (!mode && stopBarcodes) {
      stopBarcodes();
    } else if (mode && !stopBarcodes) {
      stopBarcodes = camera.lookForBarcodes(async result => {
        fire.barcode(result);
        await new Promise(resolve => setTimeout(resolve, freeze * 1000));
      });
    }
  }

  onMount(() => {
    fire.processing(true);

    let unMounting = false;
    Camera(videoEl)
      .then(c => {
        if (unMounting) {
          c.remove();
        } else {
          camera = c;
        }
      })
      .catch(() => fire.failed())
      .finally(() => fire.processing(false));

    return () => {
      if (stopBarcodes) stopBarcodes();
      if (camera) camera.remove();
    };
  });

  async function captureClicked(evt) {
    fire.image(await camera.capture());
  }

  async function toggleFlashlight(evt) {
    flashlightState = await camera.toggleFlashlight(!flashlightState);
  }

  $: flashlightDisabled = typeof flashlight === 'string' && flashlight.toLowerCase() === 'disabled';
  $: captureDisabled = typeof capture === 'string' && capture.toLowerCase() === 'disabled';
</script>

<video bind:this={videoEl} autoplay muted playsinline />

{#if camera}

  {#if flashlight && camera.hasFlashlight()}

    <button class='flashlight'
            class:on={flashlightState}
            class:off={!flashlightState}
            disabled={flashlightDisabled}
            on:click={toggleFlashlight}>
      <slot name='flashlight' />
    </button>

  {/if}

  {#if !barcode && capture}

    <button class='capture'
            disabled={captureDisabled}
            on:click={captureClicked}>
      <slot name='capture' />
    </button>

  {/if}

{/if}
