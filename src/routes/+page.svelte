<script type="ts">
	import { onMount } from 'svelte';

	onMount(function () {
		const loc = new URL(`${window.location}`);
		loc.protocol = 'ws:';
		loc.pathname = '/ss';
		const ws = new WebSocket(loc);
		ws.onopen = function () {
			console.log('opened!');
		};
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
