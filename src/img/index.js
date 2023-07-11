import { Router } from 'itty-router';

export const router = Router({ base: '/img' });

const computeAnnotationStyle = (annotation) => {
	const translated = annotation.translated.replace(/\n/g, '<br>');
	if (annotation.x && annotation.y && annotation.fontSize) {
		return {
			x: annotation.x,
			y: annotation.y,
			fontSize: annotation.fontSize,
			translated,
		};
	}
	const numberOfLines = annotation.translated.match(/\n/g)?.length + 1 || 1;
	const { x, y } = annotation.vertices[0];
	const height = annotation.vertices[2].y - y;
	const fontSize = numberOfLines > 1 ? (height / numberOfLines) * 0.8 : height;
	return {
		x,
		y,
		fontSize,
		translated,
	};
};

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
		const res = computeAnnotationStyle(annotation);
		const { x, y, fontSize, translated } = res;
		const style = `text-align: start; position: absolute; left: ${x}px; top: ${y}px; background: white; font-size: ${fontSize}px; width: max-content;`;
		return `${acc}<div style="${style}">${translated}</div>`;
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
