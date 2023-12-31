import { Router } from 'itty-router';

export const router = Router({ base: '/gcp' });

router.get('/languages', async (req) => {
	const response = await fetch('https://translation.googleapis.com/language/translate/v2/languages?target=en', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${req.token}`,
			'x-goog-user-project': 'team-interns-2023',
		},
	});
	const data = await response.json();

	const options = data.data.languages.reduce((acc, language) => {
		return `${acc}<option value="${language.language}">${language.name}</option>`;
	}, '');

	return new Response(
		JSON.stringify({
			languages: options,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.post('/detect-text', async (req) => {
	const body = await req.text();
	const { binaryImage } = body ? JSON.parse(decodeURIComponent(body)) : {};
	if (!binaryImage) {
		return new Response(
			JSON.stringify({
				message: 'No image provided',
				annotations: '[]',
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

	// if no text is detected
	if (!data.responses[0].fullTextAnnotation) {
		return new Response(
			JSON.stringify({
				message: 'No text detected',
				annotations: '[]',
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	const blocks = data.responses[0].fullTextAnnotation.pages[0].blocks;
	const page = data.responses[0].fullTextAnnotation.pages[0];
	const primarySourceLang = page.property.detectedLanguages[0].languageCode; // not sure if the first is the one with the most confidence
	const annotations = blocks
		.reduce((acc, block) => {
			// return text annotation and vertices for each paragraph
			return [
				...acc,
				...block.paragraphs.map((paragraph) => {
					return {
						vertices: paragraph.boundingBox.vertices,
						sourceLang: paragraph.words[0].property?.detectedLanguages[0]?.languageCode || primarySourceLang, // takes the languages of the first word in the paragraph (should probably take the most common language)
						text: paragraph.words.reduce((paragraphAcc, word) => {
							return (
								paragraphAcc +
								word.symbols.reduce((wordAcc, symbol) => {
									// join symbols with detected break
									const detectedBreak = symbol.property?.detectedBreak;
									let joiner = '';
									if (detectedBreak) {
										switch (detectedBreak.type) {
											case 'EOL_SURE_SPACE' || 'LINE_BREAK':
												joiner = '\n';
												break;
											case 'SPACE':
												joiner = ' ';
												break;
											default:
												joiner = '';
										}
									}
									return wordAcc + symbol.text + joiner;
								}, '')
							);
						}, ''),
					};
				}),
			];
		}, [])
		.filter((annotation) => {
			// filter out annotations that contain only numbers or special characters
			return !annotation.text.match(/^[0-9!↓↑@#$%^&*()_+\-≠≡=\[\]{};':"\\|,.<>\/? ]*$/);
		});

	// send result as single key string object for KurocoEdge to be able to capture it as a string
	return new Response(
		JSON.stringify({
			message: 'Text detected',
			annotations: JSON.stringify(annotations),
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});

router.post('/translate-text', async (req) => {
	const body = await req.text();
	const { annotations, targetLang } = JSON.parse(decodeURIComponent(body));

	if (!annotations || !targetLang) {
		return new Response(
			JSON.stringify({
				message: 'No annotations or target language provided',
				translatedAnnotations: '[]',
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	const translatedAnnotations = await Promise.all(
		annotations
			.filter((annotation) => annotation.sourceLang != targetLang) // filter out annotations that are already in the target language
			.map(async (annotation) => {
				const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${req.token}`,
						'x-goog-user-project': 'team-interns-2023',
					},
					body: JSON.stringify({
						q: annotation.text,
						target: targetLang,
						source: annotation.sourceLang,
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

	if (!translatedAnnotations.length) {
		return new Response(
			JSON.stringify({
				message: 'No annotations to translate',
				translatedAnnotations: '[]',
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
			message: 'Text translated',
			translatedAnnotations: JSON.stringify(translatedAnnotations),
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});
