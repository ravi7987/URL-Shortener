import { Service } from 'typedi';
import Redis from '../Loaders/cacheLoader';
import { ServiceResponse } from '../CustomTypes/SharedTypes';

const LRU_CACHE = 'lru_cache';
const LRU_ACCESS = 'lru_access';
const CAPACITY = 1234;

@Service()
class UtilityService {
	constructor() {}

	/**
	 * Gets keys from cache
	 * @param key @description respectove key for which value is expected
	 * @returns  value from key value pair or null
	 */
	public async getKeysFromCache(key: string): Promise<ServiceResponse<String | null>> {
		const res: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;
		try {
			if (Redis.redisClient) {
				const cacheresponse = await Redis.redisClient.HEXISTS(LRU_CACHE, key);

				if (cacheresponse) {
					const timestamp = Date.now();
					await Redis.redisClient.ZADD(LRU_ACCESS, [{ score: timestamp, value: key }]);
					const value = await Redis.redisClient.HGET(LRU_CACHE, key);
					res.response = value ?? null;
					res.success = true;
					res.error = null;
					return res;
				}

				res.success = true;
				res.response = null;
				res.error = null;
				return res;
			} else {
				throw new Error('Redis client has not been initialized');
			}
		} catch (error: any) {
			res.response = null;
			res.success = false;
			res.error = {
				internalError: true,
				message: 'Cache operation failed',
			};
			return res;
		}
	}

	/**
	 * Puts value into cache
	 * @param key @type string
	 * @param value @type string
	 * @returns boolean
	 */
	public async putIncCache(key: string, value: string): Promise<ServiceResponse<boolean | null>> {
		const res: ServiceResponse<boolean | null> = {} as ServiceResponse<boolean | null>;
		try {
			if (Redis.redisClient) {
				const now = Date.now();
				const cacheSortedSetResponse = await Redis.redisClient.ZADD(LRU_ACCESS, [{ score: now, value: key }]);
				const cacheHashMapresponse = await Redis.redisClient.HSET(LRU_CACHE, key, value);
				if (!!!cacheSortedSetResponse || !!!cacheHashMapresponse) {
					res.success = false;
					res.response = false;
					res.error = {
						internalError: true,
						message: 'Unable to add key value pair to cache',
					};
					return res;
				}

				const cacheSize = await Redis.redisClient.HLEN(LRU_CACHE);
				if (cacheSize >= CAPACITY) {
					const lruKeys = await Redis.redisClient.ZRANGE(LRU_ACCESS, 0, 0);
					if (lruKeys && lruKeys.length > 0) {
						const lruKeyToEvict = lruKeys[0];
						await Redis.redisClient.ZREM(LRU_ACCESS, lruKeyToEvict);
						await Redis.redisClient.HDEL(LRU_CACHE, lruKeyToEvict);
					}
				}

				res.success = true;
				res.response = true;
				res.error = null;
				return res;
			} else {
				throw new Error('Redis client has not been initialized');
			}
		} catch (error: any) {
			console.log(error);
			res.success = false;
			res.response = false;
			res.error = {
				internalError: true,
				message: 'Unable to add key value pair to cache',
			};
			return res;
		}
	}
}

export default UtilityService;
