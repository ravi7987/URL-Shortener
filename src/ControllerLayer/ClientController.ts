import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import ClientService from '../ServiceLayer/ClientServices';
import UtilityService from '../ServiceLayer/UtilityService';
import { ClientResponse, ServiceResponse } from '../CustomTypes/SharedTypes';
import { StatusCodes } from 'http-status-codes';

@Service()
class ClientController {
	constructor(private readonly clientService: ClientService, private readonly utilityService: UtilityService) {}

	public testController = (request: Request, Response: Response) => {
		try {
			console.log('from test controller ', this);
			this.clientService.testService();
		} catch (error) {}
	};

	/**
	 * Requests Long URL
	 * @param request @description request body will contain short URL as parameter
	 * @param response
	 */
	public fetchLongURL = async (request: Request, response: Response) => {
		const res: ClientResponse<String | null> = {
			success: false,
			errorMsg: '',
			successMsg: '',
			response: null,
		};
		try {
			const { shortURL } = request.body;
			let serviceResponse: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;

			/* check redis for cached version of the url (if it exists ) */
			const cachedResponse = await this.utilityService.getKeysFromCache(shortURL);
			if (cachedResponse.success && !!cachedResponse.response) {
				res.success = true;
				res.successMsg = 'Corresponding long URL has been fetched';
				res.response = cachedResponse.response;
				response.status(StatusCodes.MOVED_PERMANENTLY).json(res);
				return;
			}

			/* Call service layer for the processing if not found in the cache */
			serviceResponse = await this.clientService.fetchLongURL(shortURL);
			if (!!!serviceResponse || !serviceResponse.success) {
				res.errorMsg = 'Unable to find mapped long url for the respective short url';
				response.status(StatusCodes.NO_CONTENT).json(response);
				return;
			}

			/* Respond back with Long URL and status code 301 */
			res.success = true;
			res.successMsg = 'Mapping fetched successfully';
			res.response = serviceResponse.response;
			response.status(StatusCodes.MOVED_PERMANENTLY).json(res);
			response;
		} catch (Error) {
			res.success = false;
			res.errorMsg = 'Something went wrong while processing your request';
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(res);
			return;
		}
	};

	/**
	 * Create short URL
	 * @param request @description request body will contain long URL as parameter
	 * @param response
	 */
	public createShortURL = async (request: Request, response: Response) => {
		const res: ClientResponse<String | null> = {
			success: false,
			errorMsg: '',
			successMsg: '',
			response: null,
		};
		try {
			let serviceResponse: ServiceResponse<String | null> = {} as ServiceResponse<String | null>;
			const { longURL } = request.body;

			/* Call service layer for the processing */
			serviceResponse = await this.clientService.createShortURL(longURL);
			if (!!!serviceResponse || !serviceResponse.success) {
				res.errorMsg = 'Unable to create mapping';
				response.status(StatusCodes.NO_CONTENT).json(res);
				return;
			}

			/* Respond back with short url */
			res.success = true;
			res.successMsg = 'Mapping created successfully';
			res.response = serviceResponse.response;
			console.log(res);
			response.status(StatusCodes.OK).json(res);
			response;
		} catch (Error) {
			console.log(Error);
			res.success = false;
			res.successMsg = 'Something went wrong while processing your request';
			response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(res);
			return;
		}
	};
}

export default ClientController;
