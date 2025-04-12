import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import ClientService from '../ServiceLayer/ClientServices';

@Service()
class ClientController {
	constructor(private readonly clientService: ClientService) {}

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
	public fetchLongURL = (request: Request, response: Response) => {
		try {
			const { shortURL } = request.body;
			/* check redis for cached version of the url (if it exists ) */
			/* Call service layer for the processing if not found in the cache */
			/* Respond back with Long URL and status code 301 */
		} catch (Error) {}
	};

	/**
	 * Create short URL
	 * @param request @description request body will contain long URL as parameter
	 * @param response
	 */
	public createShortURL = (request: Request, response: Response) => {
		try {
			const { longURL } = request.body;
			/* Call service layer for the processing */
			/* Respond back with short URL and status code 200 */
		} catch (Error) {}
	};
}

export default ClientController;
