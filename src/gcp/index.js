import { Router } from 'itty-router';

export const router = Router({ base: '/gcp' });

router.post('/detect-text', async (req) => {
	const body = await req.text();
	const { binaryImage } = body ? JSON.parse(decodeURIComponent(body)) : {};
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

	if (data.error) {
		return new Response(
			JSON.stringify({
				message: data.error.message,
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	// if no text is detected
	if (!data.responses[0].textAnnotations) {
		return new Response(
			JSON.stringify({
				message: 'No text detected',
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	// send result as single key string object for KurocoEdge to be able to capture it as a string
	return new Response(
		JSON.stringify({
			textAnnotations: JSON.stringify(data.responses[0].textAnnotations.slice(1)),
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.post('/translate-text', async (req) => {
	// TODO: some validations and error handling
	const body = await req.text();
	const { textAnnotations, targetLang } = JSON.parse(decodeURIComponent(body));
	const translatedAnnotations = await Promise.all(
		textAnnotations.map(async (annotation) => {
			const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${req.token}`,
					'x-goog-user-project': 'team-interns-2023',
				},
				body: JSON.stringify({
					q: annotation.description,
					source: annotation.locale,
					target: targetLang,
					format: 'text',
				}),
			});
			const data = await response.json();

			return {
				...annotation,
				translated: data.data.translations[0].translatedText,
			};
		})
	);

	// send result as single key string object for KurocoEdge to be able to capture it as a string
	return new Response(
		JSON.stringify({
			translatedAnnotations: JSON.stringify(translatedAnnotations),
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});
