import { createServer } from "http";
import { parse } from "url";
import next from "next";
import redis, { redisConstants } from './lib/redis';
import logger from './lib/logger';

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();


redis.on('error', (err) => {
	logger.info(err)
	process.exit(1);
})


app.prepare().then(() => {
	createServer((req, res) => {
		const parsedUrl = parse(req.url!, true);
		handle(req, res, parsedUrl);
	}).listen(port);

	console.log(
		`> Server listening at http://localhost:${port} as ${
			dev ? "development" : process.env.NODE_ENV
		}`
	);
});



