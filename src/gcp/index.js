import { Router } from 'itty-router';

export const router = Router({ base: '/gcp' });

router.post('/detect-text', (req) => {
	// https://cloud.google.com/vision/docs/reference/rest/v1/images/annotate
	return new Response(
		JSON.stringify({
			message: 'detect-text',
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.post('/translate-text', (req) => {
	// https://cloud.google.com/translate/docs/reference/rest/v2/translate
	return new Response(
		JSON.stringify({
			message: 'translate-text',
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

