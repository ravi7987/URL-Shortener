import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import '@redis/graph'; // Import the module to augment the RedisClientType

// Now, RedisClientType should include the graph property
type RedisClientWithGraph = RedisClientType & {
	graph: (...args: any[]) => any; // Or a more specific type if available
};

/**
 * @description Configuration for connection to the Redis Client
 * @author (Ravinder)
 */
class RedisClient {
	public static redisClient: RedisClientWithGraph | null = null;

	public static async initiateConfiguration(): Promise<RedisClientWithGraph | undefined> {
		try {
			/* Use this if Redis is required to be run at a different port than default port of 6379 */
			let REDIS_CLIENT_OPTS: RedisClientOptions = {
				url: 'redis://default:redispw@localhost:6379',
				socket: {
					reconnectStrategy: function (retries) {
						if (retries > 20) {
							console.log('Too many attempts to reconnect. Redis connection was terminated');
							return new Error('Too many retries.');
						} else {
							return retries * 500;
						}
					},
				},
			};

			const redisConnection = createClient(REDIS_CLIENT_OPTS) as RedisClientWithGraph;

			redisConnection.on('error', (error) => {
				console.error('Issue with connection to the Redis Client ', error);
			});

			await redisConnection.connect();
			return redisConnection;
		} catch (error) {
			console.error('Issue with connection to the Redis Client ', error);
		}
	}

	/* Initialize the connection and assign to variable which can be used in services */
	public static async init() {
		this.redisClient = (await this.initiateConfiguration()) as RedisClientWithGraph;
		if (this.redisClient.isOpen) {
			console.info('Redis Connection Successfull');
		} else {
			console.error('Redis Connection Failed');
		}
	}
}

export default RedisClient;
