import { Service } from 'typedi';
import base62 from 'base62';
import generateUniqueId from 'generate-unique-id';
import { RepositoryResponse, ServiceResponse } from '../CustomTypes/SharedTypes';
import { ClientRepository } from '../RepositoryLayer/ClientRepository';
import UtilityService from './UtilityService';
import { TMapping } from '../CustomTypes/ClientLayerTypes';

@Service()
class ClientService {
	constructor(private clientRepository: ClientRepository, private utilityService: UtilityService) {}

	public testService() {
		try {
			console.log('from client service ', this);
		} catch (error) {}
	}

	/**
	 * Fetchs long URL for corresponding short URL (if exists) and write through cache the long URL, if found
	 * @param shortURL @type String
	 * @returns long url
	 */
	public async fetchLongURL(shortURL: string): Promise<ServiceResponse<String | null>> {
		const res: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;
		try {
			let repositoryResponse: RepositoryResponse<any>;

			// extract hashed value from short url which is id of the mapping
			const base62Value = shortURL.split('/').pop();

			// call repository service to fetch the respective mapping
			repositoryResponse = await this.clientRepository.searchMappingByShortUrl(base62Value ?? '');
			if (!!!repositoryResponse.response) {
				res.success = false;
				res.error = {
					internalError: false,
					message: 'Unable to found long url for corresponding short url',
				};
			}

			// call utility service to write through the mapping in cache
			const cacheResponse = await this.utilityService.putIncCache(shortURL, repositoryResponse.response.long_url);
			console.log(cacheResponse);
			// return the value if found
			res.success = true;
			res.response = repositoryResponse.response.long_url;
			return res;
		} catch (error) {
			res.success = false;
			res.error = {
				internalError: true,
				message: 'Internal Error',
			};
			res.response = null;
			return res;
		}
	}

	/**
	 * Creates short url
	 * @param longURL @type string @description long url whose short url needs to be computed, stored and returned
	 * @returns short url @type string @desciption computed shourt url for corresponding input long url
	 */
	public async createShortURL(longURL: String): Promise<ServiceResponse<String | null>> {
		const res: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;
		try {
			let repositoryResponse: RepositoryResponse<any> = {} as RepositoryResponse<any>;
			let serviceResponse: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;

			// check if mapping for the said url already exists
			serviceResponse = await this.checkExistanceofMapping(longURL);
			if (serviceResponse.success && serviceResponse.response !== null) {
				res.success = true;
				res.response = serviceResponse.response;
				return res;
			}

			// generate unique id
			const uniqueId = parseInt(
				generateUniqueId({
					length: 18,
					useLetters: false,
				})
			);
			if (isNaN(uniqueId)) {
				res.success = false;
				res.error = {
					internalError: true,
					message: 'Error while generating unique id',
				};
				res.response = null;
				return res;
			}

			// create base62 encoding of the unique id
			const base62Id = base62.encode(uniqueId);
			if (!!!base62Id) {
				res.success = false;
				res.error = {
					internalError: true,
					message: 'Error while base 62 encoding of the id',
				};
				res.response = null;
				return res;
			}

			// store the data in the database
			const packet: TMapping = {
				id: uniqueId,
				short_url: base62Id,
				long_url: longURL,
			};
			repositoryResponse = await this.clientRepository.addMapping(packet);
			console.log(repositoryResponse);
			if (!!!repositoryResponse) {
				res.success = false;
				res.error = {
					internalError: true,
					message: 'Error while persisting the data in database',
				};
				res.response = null;
				return res;
			}

			//  return thr response with short url
			res.success = true;
			res.response = base62Id;
			return res;
		} catch (error: any) {
			res.success = false;
			res.error = {
				internalError: true,
				message: 'Internal Error',
			};
			res.response = null;
			return res;
		}
	}

	/**
	 * Checks existanceof mapping @description service checks if mapping for the respective long url already exists in the database
	 * @param longURL @type string
	 * @returns mapped short url for given long url
	 */
	public async checkExistanceofMapping(longURL: String): Promise<ServiceResponse<String | null>> {
		const res: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;
		try {
			let repositoryResponse: RepositoryResponse<any> = {} as RepositoryResponse<any>;

			repositoryResponse = await this.clientRepository.searchMappingByLongUrl(longURL);
			if (!!!repositoryResponse.response || repositoryResponse.response === null) {
				res.success = true;
				res.response = null;
				return res;
			}

			res.success = true;
			res.response = repositoryResponse.response.short_url;
			return res;
		} catch (error: any) {
			res.success = false;
			res.error = {
				internalError: true,
				message: 'Internal Error',
			};
			res.response = null;
			return res;
		}
	}
}

export default ClientService;
