import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { APIError, ErrorType, apiErrorTypeStatus } from './common/errors';

@Catch(APIError)
export class APIErrorFilter implements ExceptionFilter {
    catch(error: APIError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = apiErrorTypeStatus(error.type);

        response
            .status(status)
            .json({
                statusCode: status,
                type: ErrorType[error.type],
                message: error.message,
                timestamp: new Date().toISOString(),
                path: request.url,
            });
    }
}