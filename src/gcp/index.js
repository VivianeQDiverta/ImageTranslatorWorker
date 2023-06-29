import { Router } from 'itty-router';

export const router = Router({ base: '/gcp' });

router.post('/detect-text', async (req) => {
	const { binaryImage } = await req.json();
	if (!binaryImage) {
		return new Response(
			JSON.stringify({
				message: 'No image provided',
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	const response = await fetch('https://vision.googleapis.com/v1/images:annotate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${req.token}`,
			'x-goog-user-project': 'team-interns-2023',
		},
		body: JSON.stringify({
			requests: [
				{
					image: {
						content: binaryImage,
					},
					features: [
						{
							type: 'TEXT_DETECTION',
						},
					],
				},
			],
		}),
	});
	const data = await response.json();

	return new Response(
		JSON.stringify({
			data,
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
