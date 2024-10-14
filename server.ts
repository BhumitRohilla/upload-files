import dotenv from 'dotenv';
dotenv.config();
import { createServer } from "http";
import { parse } from "url";
import next from "next";

import redis, { redisConstants } from './lib/redis';
import {findUrlByToken} from './controller/uploadController'
import logger from './lib/logger';
import { createSQSConsumer } from './services/sqs';

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


if (
	!process.env.SQS_QUEUE ||
	!process.env.AWS_REGION ||
	!process.env.AWS_KEY || 
	!process.env.AWS_SECRETE
) {
	logger.error('SQS is not set properly SQS_QUEUE is missing from .env. Will not start the server.');
} else {
	createSQSConsumer({
		MaxNumberOfMessage: 1,
		queueURL: process.env.SQS_QUEUE,
		region: process.env.AWS_REGION,
		credentials : {
			assessKeyId: process.env.AWS_KEY,
			secretAccessKey: process.env.AWS_SECRETE,
		},
		WaitTimeSecond: 30,
	})
}

