<script type="ts">
	import Box from '$lib/components/Box.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let username = '';
	let password = '';
</script>

<section class="login">
	<form method="post">
		<Box vertical>
			<input name="username" placeholder="username" bind:value={username} />
			<input
				name="password"
				placeholder="password"
				type="password"
				bind:value={password}
			/>
			<button type="submit">login</button>

			{#if form?.username}
				<div class="error">{form.username}</div>
			{/if}

			{#if form?.password}
				<div class="error">{form.password}</div>
			{/if}
		</Box>
	</form>
</section>

<style>
	.login {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.error {
		color: #f33;
	}
</style>
