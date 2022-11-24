<script type="ts">
import { getAppContext } from '$lib/contexts';

	import type { PageData } from './$types';

	export let data: PageData;

	const { game, gameActions } = getAppContext().stores;

	let gameName: string;

	$: {
		$game = data.game;
		$gameActions = data.actions;

		switch ($game.type) {
			case 'war':
				gameName = 'War';
				break;
			case 'standard_pinochle':
				gameName = 'Pinochle';
				break;
		}
	}
</script>

<h2>{gameName}</h2>

<style>
</style>
