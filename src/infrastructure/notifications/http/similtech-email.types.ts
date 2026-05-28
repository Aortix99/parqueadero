export interface SimiltechTokenResponse {
  code: number;
  message: string;
  token: string;
}

export interface SimiltechSendEmailRequest {
  configParams: {
    idUser: string;
    idMessage: string;
  };
  receivers: {
    emailOrigen: string;
    to: string[];
    copyTo?: string[];
    hiddenCopyTo?: string[];
  };
  email: {
    subject: string;
    message: string;
    urlHeader?: string;
    urlFooter?: string;
    url_files?: string[];
  };
}

export interface SimiltechCoreResponse {
  resultCode: number;
  message: string | null;
  data?: unknown;
}
