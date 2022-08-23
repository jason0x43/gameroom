import { createSignalServer } from './serverUtil.js';

const { handler } = await import('../build/handler.js');
const express = (await import('express')).default;
const app = express();

app.use(handler);

const server = app.listen(3000, () => {
	console.log('Listening on port 3000...');
});

createSignalServer(server, '/ss');
