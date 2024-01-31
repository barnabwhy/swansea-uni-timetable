export enum ErrorType {
    BAD_REQUEST,
    REQUEST_FAILED,
}

export class APIError extends Error  {
    type: ErrorType;
    message: string;
    cause: any;

    constructor(type: ErrorType, message: string, cause?: any) {
        super();
        this.type = type;
        this.message = message;
        this.cause = cause;
    }
}

export function apiErrorTypeStatus(type: ErrorType): number {
    return {
        [ErrorType.BAD_REQUEST]: 400,
        [ErrorType.REQUEST_FAILED]: 500,
    }[type] || 500;
}