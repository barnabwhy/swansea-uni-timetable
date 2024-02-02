import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { APIError, ErrorType, apiErrorTypeStatus } from './common/errors';

@Catch(APIError)
export class APIErrorFilter implements ExceptionFilter {
  catch(error: APIError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = apiErrorTypeStatus(error.type);

    response.status(status).send({
      statusCode: status,
      type: ErrorType[error.type],
      message: error.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
