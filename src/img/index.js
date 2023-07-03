import { Router } from 'itty-router';

export const router = Router({ base: '/img' });

router.post('/generate-annotations', async (req) => {
	const body = await req.text();
	const { translatedAnnotations } = body ? JSON.parse(decodeURIComponent(body)) : {};
	if (!translatedAnnotations) {
		return new Response(
			JSON.stringify({
				message: 'No annotations provided',
			}),
			{
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	const htmlAnnotations = translatedAnnotations.reduce((acc, annotation) => {
		const { x, y } = annotation.vertices[0];
		const fontSize = annotation.vertices[2].y - y;
		const style = `position: absolute; left: ${x}px; top: ${y}px; font-size: ${fontSize}px; background: white; padding: 0.3em;`;
		return `${acc}<div style="${style}">${annotation.translated}</div>`;
	}, '');

	// send result as single key string object for KurocoEdge to be able to capture it as a string
	return new Response(
		JSON.stringify({
			htmlAnnotations: htmlAnnotations,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});
