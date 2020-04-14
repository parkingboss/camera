<script>
  import { createDispatchers } from'./dispatch';
  import { detectBarcode } from './barcode';

  const fire = createDispatchers('image', 'barcode', 'processing');

  export let barcode = false;

  let disabled = false;
  function setProcessing(val) {
    disabled = val;
    fire.processing(val);
  }

  async function inputChanged(evt) {
    if (evt.target.files.length === 0) return;

    const file = evt.target.files[0];

    try {
      setProcessing(true);

      if (barcode) {
        fire.barcode(await detectBarcode(file));
      } else {
        fire.image(file);
      }

    } finally {
      setProcessing(false);
    }
  }
</script>

<label>
    <input type='file' {disabled} accept='image/*' on:input={inputChanged} />
</label>

<input type='file' {disabled} accept='image/*' capture='environment' on:input={inputChanged} />
