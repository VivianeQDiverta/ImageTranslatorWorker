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
				status: 400,
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
				status: data.error.code,
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
				status: 400,
			}
		);
	}

	return new Response(
		JSON.stringify({
			textAnnotations: data.responses[0].textAnnotations,
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
	const { textAnnotations, targetLang } = await req.json();
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
				})
			});
			const data = await response.json();

			return {
				...annotation,
				translated: data.data.translations[0].translatedText,				
			}
		})
	);

	return new Response(
		JSON.stringify({
			translatedAnnotations,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});
