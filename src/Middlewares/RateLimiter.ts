import { NextFunction, Request, Response } from 'express';
import Redis from '../Loaders/cacheLoader';

class RateLimiter {
	public async tokenBucketRateLimiter(
		request: Request,
		response: Response,
		next: NextFunction,
		capacity: number,
		refillRate: number
	) {
		try {
			let tokens: number;
			let lastRefillTimestamp: String;
			let currentTokenValue: number;

			// extract username from request body
			const { email } = request.body;

			// use redis  cache to get tokens left in the bucket and lastrefilltimeStamp for the user and call refill
			try {
				const cachedData = await Redis.redisClient.mGet([`${email}:tokens`, `${email}:lastRefillTimeStamp`]);
				currentTokenValue = await this.refill(capacity, cachedData[0], cachedData[1], email, refillRate);
			} catch (error) {
				const now = String(performance.now());
				const queryresult = await Redis.redisClient.mSet([
					[`${email}:tokens`, capacity],
					[`${email}:lastRefillTimeStamp`, now],
				]);
				tokens = capacity;
				lastRefillTimestamp = String(now);
				currentTokenValue = await this.refill(capacity, tokens, lastRefillTimestamp, email, refillRate);
			}

			if (currentTokenValue > 0) {
				await Redis.redisClient.set();
			}
		} catch (error) {}
	}

	private async refill(
		capacity: number,
		tokens: number,
		lastrefilltimeStamp: String,
		email: String,
		refillRate: number
	): Promise<number> {
		// param will be unique identifier for the user i.e. could be id, phone number, email id
		// which can be extracted from the request and is used for login
		const now = performance.now();
		const elapsedTime = now - Number(lastrefilltimeStamp);
		const newTokens = (elapsedTime / 1000) * refillRate;

		if (newTokens > 0) {
			tokens = Math.min(capacity, tokens + newTokens);
			lastrefilltimeStamp = String(now);
			const queryresult = await Redis.redisClient.mSet([
				[`${email}:tokens`, tokens],
				[`${email}:lastRefillTimeStamp`, lastrefilltimeStamp],
			]);
			return tokens;
		}

		return 0;
	}

	// Different approach for sliding token bucket rate limiting using sorted sets
	public async tokenBucketRateLimiterWithRedisSortedSets(
		request: Request,
		response: Response,
		next: NextFunction,
		capacity: number,
		interval: number
	): Promise<boolean> {
		// extract username from request body
		const { email } = request.body;

		const sortedSetName = email;
		const now = performance.now();
		const oneIntervalAgo = now - interval;

		const results = await Redis.redisClient
			.multi()
			.zremrangebyscore(sortedSetName, '-inf', oneIntervalAgo)
			.zrange(sortedSetName, 0, -1)
			.zadd(sortedSetName, now, now)
			.pexpire(sortedSetName, Math.ceil(interval / 1000))
			.exec();

		if (results) {
			const timeStamps = results[1];
			if (timeStamps.length() >= capacity) {
				await Redis.redisClient.zpopmax(sortedSetName);
				return false;
			} else {
				return true;
			}
		} else {
			await Redis.redisClient
				.multi()
				.zadd(sortedSetName, now, now)
				.pexpire(sortedSetName, Math.ceil(interval / 1000))
				.exec();
			return true;
		}
	}
}

export default RateLimiter;
