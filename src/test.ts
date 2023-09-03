class Test<T extends string> {
	constructor(public readonly name: T) {}

	toString(): string {
		return this.name;
	}
}

function test<T extends string>(name: T): Test<T> {
	return new Test(name);
}

const main = async () => {
	const id: Test<'test'> = test('test');
	console.log(id.toString());
};

console.log('Running');
main();
console.log('Ran');
