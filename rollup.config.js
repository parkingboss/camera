import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import svelte from 'rollup-plugin-svelte';
import pkg from './package.json';

const name = pkg.name
	.replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
	.replace(/^\w/, m => m.toUpperCase())
	.replace(/-\w/g, m => m[1].toUpperCase());

export default {
	input: 'src/index.js',
	output: [
		{ file: pkg.main, 'format': 'umd', name }
	],
	plugins: [
		resolve(),
		commonjs(),
		webWorkerLoader({
			sourcemap: true,
			inline: true,
		}),
		svelte(),
	]
};
