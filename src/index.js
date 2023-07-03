import { Router } from 'itty-router';
import { router as gcpRouter } from './gcp';
import { router as imgRouter } from './img';
import gcpAuth from './middlewares/gcpAuth';

// Create a new router
const router = Router({ base: '/'});

router.all('/gcp/*', gcpAuth, gcpRouter.handle);
router.all('/img/*', imgRouter.handle);

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/
router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
