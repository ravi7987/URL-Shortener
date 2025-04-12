export type ServiceResponse<T> = {
	error: ErrorPacket | null;
	response: T;
	success: boolean;
};

export type ErrorPacket = {
	internalError: boolean;
	message: String;
};
