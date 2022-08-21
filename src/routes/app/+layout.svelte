<script>
	import Hbox from '$lib/components/Hbox.svelte';
</script>

<div class="menubar">
	<Hbox between middle>
		<strong>GameRoom</strong>
		<a href="/login">Logout</a>
	</Hbox>
</div>

<slot />

<style>
	.menubar {
		border-bottom: 1px solid #ccc;
		padding: 0.5rem;
	}

	a {
		text-decoration: none;
	}
</style>
