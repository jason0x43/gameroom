<script type="ts">
	import Box from '$lib/components/Box.svelte';
	import Button from '$lib/components/Button.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { Game } from '$lib/db/schema';

	const options: { value: Game['type']; label: string }[] = [
		{ value: 'war', label: 'War' }
	];
</script>

<form method="post" action="/app/game">
	<Box vertical>
		<Select name="type" {options} value={options[0].value} />
		<Button type="submit">Start a new game</Button>
	</Box>
</form>
