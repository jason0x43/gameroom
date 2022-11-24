<script type="ts">
	import { setAppContext } from '$lib/contexts';
	import { createStores } from '$lib/stores';
	import '../app.css';

	const stores = createStores();

	setAppContext({
		stores
	});
</script>

<slot />
