import { Service } from 'typedi';
import MappingModel from '../Schemas/Mapping';
import { RepositoryResponse } from '../CustomTypes/SharedTypes';
import { TMapping } from '../CustomTypes/ClientLayerTypes';

@Service()
export class ClientRepository {
	/**
	 * Searchs mapping between long URL and Short URL using id of the short URL
	 * @param id @type string
	 * @returns mapping object from database
	 */
	async searchMappingByShortUrl(shortUrl: String): Promise<RepositoryResponse<any>> {
		let response: RepositoryResponse<any>;
		try {
			const result = await MappingModel.findOne({ short_url: shortUrl });
			response = { response: result };
			return response;
		} catch (error: any) {
			throw new Error(error);
		}
	}

	/**
	 * Adds mapping @description add document of type TMapping to the mapping collection of the database
	 * @param packet @type TMapping @see CustomTypes/ClientLayerTypes
	 * @returns mongo response
	 */
	async addMapping(packet: TMapping): Promise<RepositoryResponse<any>> {
		let response: RepositoryResponse<any>;
		try {
			const newInstance = new MappingModel(packet);
			const result = newInstance.save();
			response = { response: result };
			return response;
		} catch (error: any) {
			throw new Error(error);
		}
	}

	/**
	 * Searchs mapping by long url @description search for mapping using long url if it already exists in the database
	 * @param longURL @type string
	 * @returns mapping for long url or null
	 */
	async searchMappingByLongUrl(longURL: String): Promise<RepositoryResponse<any>> {
		let response: RepositoryResponse<any>;
		try {
			const result = await MappingModel.findOne({ long_url: longURL });
			response = { response: result };
			return response;
		} catch (error: any) {
			throw new Error(error);
		}
	}
}
