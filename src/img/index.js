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
		const { x, y } = annotation.boundingPoly.vertices[0];
		const width = annotation.boundingPoly.vertices[2].x - x;
		const height = annotation.boundingPoly.vertices[2].y - y;
		const style = `position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-family: sans-serif; font-weight: bold; color: black;`;
		return `${acc}<div style="${style}">${annotation.translated}</div>`;
	}, '');

	// send result as single key string object for KurocoEdge to be able to capture it as a string
	return new Response(
		JSON.stringify({
			htmlAnnotations,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
});
