<script context=module>
  let hideOnNavigate = navigator.standalone;

  export function setHideOnNavigate(val) {
    hideOnNavigate = val;
  }

  export function getHideOnNavigate() {
    return hideOnNavigate;
  }

  let permitted = null;

  checkPermitted();

  async function checkPermitted() {
    try {
      const perm = await navigator.permissions.query({ name: 'camera' });
      if (perm.state != 'prompt') {
        permitted = perm.state === 'granted';
        return;
      }
    } catch (e) {
    }

    try {
      const um = await navigator.mediaDevices.getUserMedia({ video: true });
      setTimeout(() => um.getTracks().forEach(t => t.stop()), 5);
      permitted = true;
    } catch (err) {
      permitted = false;
    }
  }
</script>

<script>
  import InputCamera from './InputCamera.svelte';
  import GumCamera from './GumCamera.svelte';

	import { fade } from 'svelte/transition';

  import { createDispatchers } from './dispatch';

  const fire = createDispatchers('image', 'barcode');
  const fadeDuration = 500;

  export let freeze = 2;
  export let navigating = false;
  export let barcode = false; // false | true
  export let flashlight = true; // false | 'disabled' | true
  export let capture = true; // false | 'disabled' | true

  let busy = false;
  let captured = null;

  $: video = permitted && (!hideOnNavigate || !navigating);
  $: freezeMilliseconds = (freeze * 1000) - fadeDuration;

  function onProcessing(evt) {
    busy = evt.detail;
  }

  function onImage(evt) {
    setCaptured(evt.detail);
    fire.image(evt.detail);
  }

  function onBarcode(evt) {
    setCaptured(evt.detail.image);
    fire.barcode(evt.detail);
  }

  function onFailed(evt) {
    permitted = false;
  }

  function setCaptured(image) {
    captured = URL.createObjectURL(image);
    setTimeout(function() { captured = null}, freezeMilliseconds);
  }
</script>

<figure class='camera' class:barcode class:video class:busy class:capture={!barcode} class:input={!video}>
  <InputCamera
    {barcode}
    on:image={onImage}
    on:barcode={onBarcode}
    on:processing={onProcessing}
  />

  {#if video}

  <GumCamera
    {barcode}
    {flashlight}
    {capture}
    on:image={onImage}
    on:barcode={onBarcode}
    on:processing={onProcessing}
    on:failed={onFailed}>
    <slot name='flashlight'>Flashlight</slot>
    <slot name='capture'>Capture</slot>
  </GumCamera>

  {/if}

  {#if captured && freeze > 0}

  <img out:fade|local={{ duration: fadeDuration }} alt='captured image' src={captured} />

  {/if}
</figure>
