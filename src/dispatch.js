import { createEventDispatcher } from 'svelte';

export function createDispatchers(...names) {
  const dispatch = createEventDispatcher();

  return names.reduce((result, n) => {
    result[n] = args => dispatch(n, args);
  }, {});
}
