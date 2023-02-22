// @ts-ignore
BigInt.prototype.toJSON = function () {
	return 'bi:' + this.toString();
};

// @ts-ignore
JSON._parse = JSON.parse;
JSON.parse = function (text, reviver) {
	function overrideReviver(key, value) {
		if (typeof value === 'string' && value.startsWith('bi:')) {
			return BigInt(value.substring(3));
		}
		return reviver ? reviver(key, value) : value;
	}

	// @ts-ignore
	return JSON._parse(text, overrideReviver);
};
