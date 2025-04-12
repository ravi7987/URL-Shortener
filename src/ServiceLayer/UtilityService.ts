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
	public async getKeysFromCache(key: String): Promise<ServiceResponse<String | null>> {
		const res: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;
		try {
			const cacheresponse = Redis.redisClient.hexists(LRU_CACHE, key);
			const exists = cacheresponse === 1 ? true : false;

			if (exists) {
				const timestamp = Date.now();
				await Redis.redisClient.zadd(LRU_ACCESS, timestamp, key);
				const value = await Redis.redisClient.hget(LRU_CACHE, key);
				res.response = value;
				res.success = true;
				res.error = null;
				return res;
			}

			res.success = true;
			res.response = null;
			res.error = null;
			return res;
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
	public async putIncCache(key: String, value: String): Promise<ServiceResponse<boolean | null>> {
		const res: ServiceResponse<boolean | null> = {} as ServiceResponse<boolean | null>;
		try {
			const now = Date.now();
			const cacheSortedSetResponse = await Redis.redisClient.zadd(LRU_ACCESS, now, key);
			const cacheHashMapresponse = await Redis.redisClient.hset(LRU_CACHE, key, value);

			if (!!!cacheSortedSetResponse || !!!cacheHashMapresponse) {
				res.success = false;
				res.response = false;
				res.error = {
					internalError: true,
					message: 'Unable to add key value pair to cache',
				};
				return res;
			}

			const cacheSize = await Redis.redisClient.hlen(LRU_CACHE);
			if (cacheSize >= CAPACITY) {
				const lruKeys = await Redis.redisClient.zrange(LRU_ACCESS, 0, 0);
				if (lruKeys && lruKeys.length > 0) {
					const lruKeyToEvict = lruKeys[0];
					await Redis.redisClient.zrem(LRU_ACCESS, lruKeyToEvict);
					await Redis.redisClient.hdel(LRU_CACHE, lruKeyToEvict);
				}
			}

			res.success = true;
			res.response = true;
			res.error = null;
			return res;
		} catch (error: any) {
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
