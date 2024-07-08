// deno-lint-ignore-file no-explicit-any
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { compose, mixin } from '../../src/utils/mixin.ts';

// Example mixin functions
function withLogger<T extends new (...args: any[]) => any>(Class: T): T {
	return class extends Class {
		log(message: string) {
			return `[LOG] ${message}`;
		}
	};
}

function withTimestamp<T extends new (...args: any[]) => any>(Class: T): T {
	return class extends Class {
		getTimestamp(): string {
			return new Date().toISOString();
		}
	};
}

// Base class
class MyBaseClass {
	constructor(public name: string) {}
}

Deno.test('mixin', async (t) => {
	await t.step('combines Logger with MyBaseClass', () => {
		const MixedClass = mixin(MyBaseClass, withLogger);
		const instance = new MixedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
		// TODO: how to avoid as any?
		assertEquals((instance as any).log('Hello'), '[LOG] Hello');
	});

	await t.step('combines Timestamp with MyBaseClass', () => {
		const MixedClass = mixin(MyBaseClass, withTimestamp);
		const instance = new MixedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
		assertEquals(typeof (instance as any).getTimestamp(), 'string');
	});

	await t.step(
		'combines Logger and Timestamp mixins with MyBaseClass',
		() => {
			const MixedClass = mixin(MyBaseClass, withLogger, withTimestamp);
			const instance = new MixedClass('TestInstance');

			assertEquals(instance.name, 'TestInstance');
			assertEquals((instance as any).log('Hello'), '[LOG] Hello');
			assertEquals(typeof (instance as any).getTimestamp(), 'string');
		},
	);

	// Additional edge cases
	await t.step('with no mixins returns the base class unchanged', () => {
		const MixedClass = mixin(MyBaseClass);
		const instance = new MixedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
	});

	await t.step(
		'with multiple instances of the same results in correct behavior',
		() => {
			const MixedClass = mixin(
				MyBaseClass,
				withLogger,
				withLogger,
				withLogger,
			);
			const instance = new MixedClass('TestInstance');

			assertEquals(instance.name, 'TestInstance');
			assertEquals((instance as any).log('Hello'), '[LOG] Hello');
		},
	);
});

Deno.test('compose', async (t) => {
	await t.step('with Logger mixin', () => {
		const ComposedClass = compose(withLogger)(MyBaseClass);
		const instance = new ComposedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
		// TODO: how to avoid as any?
		assertEquals((instance as any).log('Hello'), '[LOG] Hello');
	});

	await t.step('with Timestamp mixin', () => {
		const ComposedClass = compose(withTimestamp)(MyBaseClass);
		const instance = new ComposedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
		assertEquals(typeof (instance as any).getTimestamp(), 'string');
	});

	await t.step('with Logger and Timestamp mixins', () => {
		const ComposedClass = compose(withLogger, withTimestamp)(MyBaseClass);
		const instance = new ComposedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
		assertEquals((instance as any).log('Hello'), '[LOG] Hello');
		assertEquals(typeof (instance as any).getTimestamp(), 'string');
	});

	await t.step('with multiple instances of Logger mixin', () => {
		const ComposedClass = compose(withLogger, withLogger, withLogger)(
			MyBaseClass,
		);
		const instance = new ComposedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
		assertEquals((instance as any).log('Hello'), '[LOG] Hello');
	});

	await t.step('with no mixins', () => {
		const ComposedClass = compose()(MyBaseClass);
		const instance = new ComposedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
	});

	await t.step('with function as a mixin', () => {
		// TODO: I didn't understand how to properly type this test
		const ComposedClass = compose((Class: typeof MyBaseClass) => {
			return class extends Class {
				additionalMethod() {
					return 'Additional method';
				}
			};
		})(MyBaseClass as any);

		const instance = new ComposedClass('TestInstance');

		assertEquals(instance.name, 'TestInstance');
		assertEquals(instance.additionalMethod(), 'Additional method');
	});
});
