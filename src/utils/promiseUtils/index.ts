import { isPromise } from './isPromise.ts';
import { after } from './after.ts';
import { afterReturn } from './afterReturn.ts';
import { mapAfterAllReturn } from './mapAfterAllReturn.ts';
import { promiseMap } from './map.ts';
import { promiseTry } from './try.ts';

export default {
	isPromise,
	after,
	afterReturn,
	mapAfterAllReturn,
	map: promiseMap,
	try: promiseTry,
};
