import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
const algorithm = 'aes-256-ctr';

export function encrypt(text: string, salt: string): string {
	const key = Buffer.from(process.env.DB_KEY!!, 'hex');
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(algorithm, key, iv);
	let encrypted = cipher.update(`${salt}:${text}`);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
	const key = Buffer.from(process.env.DB_KEY!!, 'hex');
	const textParts = text.split(':');
	const iv = Buffer.from(textParts.shift()!!, 'hex');
	const encryptedText = Buffer.from(textParts.join(':'), 'hex');
	const decipher = crypto.createDecipheriv(algorithm, key, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString().split(':').pop()!!;
}

export function hash(query: string, iterations: number = 10): Promise<string> {
	return bcrypt.hash(query, iterations);
}

export function compareHash(query: string, hash: string): Promise<boolean> {
	return bcrypt.compare(query, hash);
}
