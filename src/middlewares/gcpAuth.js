import { Base64 } from 'js-base64';

const gcpAuth = async (req, env) => {
	const serviceAccount = JSON.parse(env.SERVICE_ACCOUNT_JSON);

	// remmove header and footer from pem
	const pemHeader = '-----BEGIN PRIVATE KEY-----';
	const pemFooter = '-----END PRIVATE KEY-----';
	const pem = serviceAccount.private_key.replace(/\n/g, '');
	const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);

    // import private key as PKCS8
	const buffer = Base64.toUint8Array(pemContents);
	const algorithm = {
		name: 'RSASSA-PKCS1-v1_5',
		hash: {
			name: 'SHA-256',
		},
	};
	const extractable = false;
	const keyUsages = ['sign'];
	const privateKey = await crypto.subtle.importKey('pkcs8', buffer, algorithm, extractable, keyUsages);

    // build jwt
	const header = Base64.encodeURI(
		JSON.stringify({
			alg: 'RS256',
			typ: 'JWT',
			kid: serviceAccount.private_key_id,
		})
	);
	const iat = Math.floor(Date.now() / 1000);
	const exp = iat + 3600;
	const payload = Base64.encodeURI(
		JSON.stringify({
			iss: serviceAccount.client_email,
            sub: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/cloud-platform',
			aud: 'https://oauth2.googleapis.com/token',
			exp,
			iat,
		})
	);
    // sign jwt
	const inputArrayBuffer = new TextEncoder().encode(`${header}.${payload}`);
	const outputArrayBuffer = await crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, inputArrayBuffer);
	const signature = Base64.fromUint8Array(new Uint8Array(outputArrayBuffer), true);

	const token = `${header}.${payload}.${signature}`;
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${token}`,
    });
    const data = await res.json();
    req.token = data.access_token;
};

export default gcpAuth;
