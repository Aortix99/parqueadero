import { HttpException, HttpStatus } from '@nestjs/common';

export class ClientEmailRequiredException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          'Se requieren nombre y correo del cliente para enviar la notificación de salida.',
        code: 'CLIENT_EMAIL_REQUIRED',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
