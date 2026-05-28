import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  EmailNotificationGateway,
  ExitEmailPayload,
} from 'src/domain/email-notification.gateway';
import {
  buildExitEmailMessage,
  buildExitEmailSubject,
  buildUniqueIdMessage,
} from './exit-email-message.builder';
import {
  SimiltechCoreResponse,
  SimiltechSendEmailRequest,
  SimiltechTokenResponse,
} from './similtech-email.types';

@Injectable()
export class EmailApiGateway implements EmailNotificationGateway {
  private readonly logger = new Logger(EmailApiGateway.name);

  async sendExitNotification(payload: ExitEmailPayload): Promise<void> {
    const baseUrl = this.getBaseUrl();
    if (!this.isConfigured()) {
      this.logger.warn(
        'API de correo no configurada (EMAIL_API_USERNAME / EMAIL_API_PASSWORD); correo omitido',
      );
      return;
    }
    console.log('si ando llegando a enviar correo con payload: ', payload);
    const token = await this.fetchToken(baseUrl);
    console.log('sali con el token, ahora voy a enviar el correo', token);
    const body = this.buildSendEmailBody(payload);

    const response = await axios.post<SimiltechCoreResponse>(
      `${baseUrl}/api/email/sendEmail`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15_000,
      },
    );
    if (response.data.resultCode !== 1) {
      throw new Error(
        response.data.message ?? 'La API de correo rechazó el envío',
      );
    }
  }

  private isConfigured(): boolean {
    return Boolean(
      process.env.EMAIL_API_USERNAME?.trim() &&
      process.env.EMAIL_API_PASSWORD?.trim(),
    );
  }

  private getBaseUrl(): string {
    const raw = process.env.EMAIL_API_BASE_URL?.trim() || '';
    return raw.replace(/\/$/, '');
  }

  private async fetchToken(baseUrl: string): Promise<string> {
    const username = process.env.EMAIL_API_USERNAME;
    const password = process.env.EMAIL_API_PASSWORD;
    console.log(
      'Obteniendo token de correo con username:',
      `${baseUrl}/api/token`,
    );
    try {
      const response = await axios.post<SimiltechTokenResponse>(
        `${baseUrl}/api/token`,
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (response.data.code !== 1 || !response.data.token) {
        throw new Error(
          response.data.message ?? 'No se obtuvo token de la API de correo',
        );
      }
      console.log('Token de correo obtenido correctamente: ', response.data);
      return response.data.token;
    } catch (err) {
      const message = this.extractAxiosMessage(err);
      throw new Error(`Error al autenticar API de correo: ${message}`);
    }
  }

  private buildSendEmailBody(
    payload: ExitEmailPayload,
  ): SimiltechSendEmailRequest {
    const idUser = process.env.EMAIL_ID_USER?.trim() || 'parquin';
    const emailOrigen =
      process.env.EMAIL_ORIGEN?.trim() ||
      process.env.EMAIL_FROM?.trim() ||
      'noreply@parquin.local';

    const exitAt = payload.exitAt;
    const idMessage = buildUniqueIdMessage(payload.sessionId, exitAt);

    const request: SimiltechSendEmailRequest = {
      configParams: {
        idUser,
        idMessage,
      },
      receivers: {
        emailOrigen,
        to: [payload.to],
      },
      email: {
        subject: buildExitEmailSubject(payload.plate),
        message: buildExitEmailMessage(payload),
      },
    };

    const urlHeader = process.env.EMAIL_URL_HEADER?.trim();
    const urlFooter = process.env.EMAIL_URL_FOOTER?.trim();
    if (urlHeader) request.email.urlHeader = urlHeader;
    if (urlFooter) request.email.urlFooter = urlFooter;

    return request;
  }

  private extractAxiosMessage(err: unknown): string {
    if (err instanceof AxiosError) {
      const data = err.response?.data as { message?: string } | undefined;
      if (data?.message) return data.message;
      if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return 'Error desconocido';
  }
}
