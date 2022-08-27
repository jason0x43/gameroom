<script type="ts">
	import Vbox from '$lib/components/Vbox.svelte';

	export let errors: Record<string, string> | undefined;

	let username = '';
	let password = '';
</script>

<section class="login">
	<form method="post">
		<Vbox>
			<input name="username" placeholder="username" bind:value={username} />
			<input
				name="password"
				placeholder="password"
				type="password"
				bind:value={password}
			/>
			<button type="submit">login</button>

			{#if errors?.username}
				<div class="error">{errors.username}</div>
			{/if}

			{#if errors?.password}
				<div class="error">{errors.password}</div>
			{/if}
		</Vbox>
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
