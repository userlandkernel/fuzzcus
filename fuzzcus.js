/*
 * WIP: WebAssembly fuzzer
*/

let wasmImports = {
  env: {
    // null
    printf: function printf () {
      // ...
    }
  }
};

var fuzzy_target = function(receiver) {
  let magic = new Uint8Array([0,97,115,109,1,0,0,0,1,144,128,128,128,0,3,96,1,127,1,127,96,2,127,127,1,127,96,0,1,127,2,142,128,128,128,0]);
	var wasmCode = new Uint8Array([...magic, ...receiver]);
  wasmCode = wasmCode.slice(0, 0x1000);
	var wasmModule =  new WebAssembly.Module(wasmCode);
	var instance = new WebAssembly.Instance(wasmModule, wasmImports);
	console.log(instance);
};

let UINT32_MAX = new Uint32Array([-1])[0];
let UINT16_MAX = new Uint16Array([-1])[0];
let UINT8_MAX = new Uint8Array([-1])[0];

var FUZZ_TYPES = [Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Float64Array];
var FUZZ_SIZE_MAX = UINT32_MAX;

function INT(F){
  return Math.floor(F);
}

function FUZZ_SIZE_RANDOM() {
  return Math.floor(Math.random() * FUZZ_SIZE_MAX);
}

function FUZZ_UINT8_RANDOM() {
  return Math.floor(Math.random() * UINT8_MAX);
}

function FUZZ_UINT16_RANDOM() {
  return Math.floor(Math.random() * UINT16_MAX);
}

function FUZZ_UINT32_RANDOM() {
  return Math.floor(Math.random() * UINT32_MAX);
}

function FUZZ_BOOL_RANDOM() {
	return Math.floor(Math.random() * UINT32_MAX) % 2;
}

function FUZZ_FLOAT_RANDOM(){
	return new AnimationEvent('').timeStamp * Math.random();
}

function FUZZ_FLIP(N) {
	let FLIP_BIT = 70;
	return N ^ FLIP_BIT;
}

function FUZZ_RANDOM_TYPE(INITIALIZER) {
  var TYPES_MAX = FUZZ_TYPES.length;
  var TYPES_RND =  Math.floor(Math.random() * TYPES_MAX);
  return new FUZZ_TYPES[TYPES_RND](INITIALIZER);
}

function FUZZ_RANDOM_PROPERTY(o = newObject(), sizeref = new ArrayBuffer()) {

  var NUMERIC = Math.floor(INT(Math.random() * UINT32_MAX % 2));

  if(NUMERIC){
    var isize = Math.random()*UINT16_MAX;
    var INDEX_RND = Math.floor(INT(Math.random() * UINT8_MAX));
    o[INDEX_RND] = FUZZ_RANDOM_TYPE(INT(isize));
    new Uint32Array(sizeref)[0] += isize;
  }
  
}

function FUZZ_RANDOM_WASM_GLOBAL() {
	
	var t = "f64";
	switch(FUZZ_BOOL_RANDOM() + FUZZ_BOOL_RANDOM()) {
		case 2:
			t = "f64";
			break;
		case 1:
			t = "f32";
			break;
		case 0:
			t = "i32";
			break;
		default:
			t = "f64";
			break;
	}
	return new WebAssembly.Global({value: t, mutable: FUZZ_BOOL_RANDOM()}, FUZZ_BOOL_RANDOM() ? FUZZ_FLOAT_RANDOM() : FUZZ_UINT32_RANDOM());
}

function TYPE_CONFUSED(expectedType, object){
	return typeof object !== expectedType;
}

function fuzzcus(target = fuzzy_target, CYCLES = 0, P_DEPTH = 0, P_COUNT = 0) {
	
	var M = 0x100;
	
	var nums = new Array(M);
	nums.fill(FUZZ_UINT8_RANDOM());
	
	var strings = new Array(M);
	strings.fill("HAXX");
	
	var arrays = new Array(M);
	arrays.push([]);
	
	

	
	// Fuzz for each size
	for(CYLCE = CYCLES; CYLCE >= 0; CYLCE--){

		var isize = new Uint32Array(1);
		isize[0] = INT(Math.random()*UINT16_MAX);

		instance = FUZZ_RANDOM_TYPE(isize[0]);

		try {

			// Fuzz random properties
			for(PROP = P_COUNT; PROP >= 0; PROP--){

				FUZZ_RANDOM_PROPERTY(instance, isize.buffer);
				// Fuzz each property to a certain depth
				// UNIMP

			}

			// fill random
			if(instance.fill) {
				fsize = INT(Math.random() * 4);
				isize[0] += fsize;
				instance.fill(FUZZ_RANDOM_TYPE(fsize));
			}
			
			console.log("FUZZ OBJECT WITH SIZE +/-: "+isize);
		} 
		
		catch(exc) {
			console.warn('[FUZZ_PROP]: '+exc.message);
		}

		console.log(instance); // log the instance
		
		try {
			target(instance);
		}
		catch(exc) {
			console.warn('[FUZZ_TARGET]: '+exc.message);
		}

	} // END_OF_CYCLES
} // END_OF_FUZZCUS


// Example Usage
var cycles = 100;
var propertyDepth = 3;
var propertyCount = 50;
fuzzcus(fuzzy_target, cycles, propertyDepth, propertyCount); 
