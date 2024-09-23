import Redis, { RedisOptions } from 'ioredis';
import logger from './logger';
const {REDIS_PORT, REDIS_HOST} = process.env
const redisConfig: RedisOptions = {
    port: 6379,
    host: '127.0.0.1',
}

if (REDIS_PORT) {
    const redisPortInNumber = parseInt(REDIS_PORT);
    if (isNaN(redisPortInNumber)) {
        logger.error('Invalid Redis Port Provided');
        process.exit()
    }
    redisConfig.port = redisPortInNumber
}
if (REDIS_HOST) {
    redisConfig.host = REDIS_HOST
}
const redis = new Redis(redisConfig)
export default redis;

redis.on('error', (error) => {
    logger.error(error);
});

redis.on('connect', () => {
    logger.info('Redis Connected');
})

export const redisConstants = {
    'multiPartUploadDataExpireTimeInSecond': 1 * 60 * 60,

    'multiPartUploadData': 'multiPartUploadData',
    getKeyForMultiPartUploadHset(token: string): string {
        return this.multiPartUploadData + ':' + token;
    }
}