export {};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			FTP_BIND: string;
			FTP_PORT: string;
			API_PORT: string;
			WS_PORT: string;

			DISCORD_SECRET: string;
			DISCORD_CLIENT: string;
			DISCORD_CALLBACK: string;

			MONGO_URI: string;
			DB_KEY: string;

			FTP_TLS_KEY: string;
			FTP_TLS_CERT: string;
			FTP_PASV_HOST?: string;
			FTP_PASV_MIN?: string;
			FTP_PASV_MAX?: string;

			COOKIE_SECRET: string;
			WEB_URL: string;
			FILE_SIZE_LIMIT: string;

			GITHUB_AUTH: string;
			CLERK_SECRET_KEY: string;
		}
	}
}
