import { Router } from 'itty-router';

export const router = Router({ base: '/img' });

router.post('/generate-annotations', async (req) => {
	const body = await req.text();
	const { translatedAnnotations } = body ? JSON.parse(decodeURIComponent(body)) : {};
	if (!translatedAnnotations) {
		return new Response(
			JSON.stringify({
				message: 'No annotations provided',
				htmlAnnotations: '',
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	const htmlAnnotations = translatedAnnotations.reduce((acc, annotation) => {
		const numberOfLines = annotation.translated.match(/\n/g)?.length + 1 || 1;
		annotation.translated = annotation.translated.replace(/\n/g, '<br>');
		const { x, y } = annotation.vertices[0];
		const height = annotation.vertices[2].y - y;
		const fontSize = numberOfLines > 1 ? (height / numberOfLines) * 0.8 : height;
		const style = `text-align: start; position: absolute; left: ${x}px; top: ${y}px; background: white; font-size: ${fontSize}px; width: max-content;`;
		return `${acc}<div style="${style}">${annotation.translated}</div>`;
	}, '');

	const wrapppedHtmlAnnotations = `<div class="annotationsContainer">${htmlAnnotations}</div>`;

	// send result as single key string object for KurocoEdge to be able to capture it as a string
	return new Response(
		JSON.stringify({
			message: 'Annotations generated',
			htmlAnnotations: wrapppedHtmlAnnotations,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});
