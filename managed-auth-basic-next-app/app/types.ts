export interface ConnectContext {
  externalUserId: string;
  token: string;
  connectLinkUrl: string | null;
  expiresAt: string;
}

