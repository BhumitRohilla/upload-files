import dotenv from 'dotenv';
dotenv.config();
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import redis, { redisConstants } from './lib/redis';
import {findUrlByToken} from './controller/uploadController'
import logger from './lib/logger';

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();


redis.on('error', (err) => {
	logger.error(err)
	process.exit(1);
})

findUrlByToken('test').then((data) => {
	logger.info('Mongo Server Connected');
}).catch((error) => {
	logger.error(error)
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



