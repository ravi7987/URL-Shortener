export type ServiceResponse<T> = {
	error: ErrorPacket | null;
	response: T;
	success: boolean;
};

export type ErrorPacket = {
	internalError: boolean;
	message: String;
};

export type ClientResponse<T> = {
	success: boolean;
	errorMsg: string;
	successMsg: string;
	errors?: string[];
	response: T | undefined;
	data?: T | undefined;
};

export type RepositoryResponse<T> = {
	response: T;
};
