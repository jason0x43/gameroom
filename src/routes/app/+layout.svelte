<script>
	import Box from '$lib/components/Box.svelte';
</script>

<div class="menubar">
	<Box justify="between" align="center">
		<strong>GameRoom</strong>
		<a href="/login">Logout</a>
	</Box>
</div>

<Box justify="center" align="center" fill>
	<slot />
</Box>

<style>
	.menubar {
		border-bottom: 1px solid #ccc;
		padding: 0.5rem;
	}

	a {
		text-decoration: none;
	}
</style>
