/*
 * WIP: WebAssembly fuzzer
*/

function callback(args){
	alert(args);
}

let wasmImports = {
  env: {
    // null
    printf: function printf () {
      // ...
    }
  }
};

let Fuzzcus = function Fuzzcus(TGT = callback, CYCLES = 0, CYCLEDEPTH = 0) {

	console.info("[FUZZCUS]: Fuzzing "+CYCLES+" cycles with depth "+CYCLEDEPTH);

	window.UINT32_MAX = new Uint32Array([-1])[0];
	window.UINT16_MAX = new Uint16Array([-1])[0];
	window.UINT8_MAX = new Uint8Array([-1])[0];

	var wasm_basic_module = new Uint8Array([0,97,115,109,1,0,0,0,1,133,128,128,128,0,1,96,0,1,127,3,130,128,128,128,0,1,0,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,145,128,128,128,0,2,6,109,101,109,111,114,121,2,0,4,109,97,105,110,0,0,10,138,128,128,128,0,1,132,128,128,128,0,0,65,42,11]);

	var seed8 = 0;
	var seed16 = 0;
	var seed32 = 0;
	var seedfloat = 0;

	var iseed8 = 0;
	var iseed16 = 0;
	var iseed32 = 0;
	var iseedfloat = 0;

	this.toInt = function(v) {
		return Math.floor(parseInt(v));
	};

	this.genBool = function(){
		return Math.floor(Math.random() * UINT32_MAX) % 2;
	};

	this.genUint8 = function() {
		return Math.floor(Math.random() * UINT8_MAX);
	};

	this.genUint16 = function() {
		return Math.floor(Math.random() * UINT16_MAX);
	}

	this.genUint32 = function() {
		return Math.floor(Math.random() * UINT32_MAX);
	}

	this.genFloat = function() {
		return 1337.1337 * Math.random() * 0x1000000;
	}

	this.genTypedArray = function(len = 0) {
		let _types = [Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Float64Array];
		return new _types[Math.floor(Math.random()*_types.length)](len);
	}

	this.genWASMGlobalType = function() {
		let _wasmglobaltypes = ["f64", "f32", "i64", "i32"];
		return _wasmglobaltypes[this.toInt(Math.random()*_wasmglobaltypes.length)];
	}

	this.genRandomNumber = function() {
		let _numberTypeGenerators = [this.genUint8, this.genUint16, this.genUint32, this.genFloat];
		return _numberTypeGenerators[this.toInt(Math.random()*_numberTypeGenerators.length)]();
	}

	this.init = function() {
		iseed8 = this.genUint8();
		iseed16 = this.genUint16();
		iseed32 = this.genUint32();
		iseedfloat = this.genFloat();
		seed8 = iseed8;
		seed16 = iseed16;
		seed32 = iseed32;
		seedfloat = iseedfloat;
		console.info("[FUZZCUS][CYCLE "+CYCLES+"]: SEED8: "+seed8+" SEED16: "+seed16+" SEED32: "+seed32+" SEEDFLOAT: "+seedfloat);
	}


	function s_next(which){
		if(which == 8 || which == 'a')
			seed8 = seed8 >> 1;
		else if(which == 16 || which == 'a')
			seed16 = seed16 >> 1;
		else if(which == 32 || which == 'a')
			seed32 = seed32 >> 1;
		else if(which == 'f' || which == 'a')
			seedfloat = parseFloat(seedfloat >> 1.0);
	}

	while(CYCLES > 0) {

		this.init();

		console.info("[FUZZCUS]: Creating numbers...");
		var numbers = new Array(CYCLEDEPTH);
		for(i = 0; i < CYCLEDEPTH; i++) {
			numbers.fill(seed8);
			s_next(8);
		}

		console.info("[FUZZCUS]: Creating strings...");
		var strings = new Array(CYCLEDEPTH);
		strings.fill("main");

		console.info("[FUZZCUS]: Creating arrays...");
		var arrays = new Array(CYCLEDEPTH);
		arrays.fill([]);

		console.info("[FUZZCUS]: Creating function references...");
		var funcrefs = new Array(CYCLEDEPTH);
		funcrefs.fill(0);

		console.info("[FUZZCUS]: Creating WASM globals...");
		var wasmglobals = new Array(CYCLEDEPTH);
		for(i = 0; i < CYCLEDEPTH; i++){
			var rwasmtype = this.genWASMGlobalType();
			var rmutable = this.genBool();
			var rnum = this.genRandomNumber();
			console.warn("[FUZZCUS][WGLOBAL_CREATE]: type: "+rwasmtype+" rmutable: "+rmutable+" rnum: "+rnum);
			try {
				wasmglobals[i] = new WebAssembly.Global({value:rwasmtype, mutable:rmutable}, rnum);
			} catch(exc){
				console.warn("[FUZZCUS][WGLOBAL_CREATE]: "+exc.message);
			}
			s_next('a');
		}

		console.info("[FUZZCUS]: Creating WASM tables...");
		var wasmtables = new Array(CYCLEDEPTH);
		for(i =0; i < CYCLEDEPTH; i++){
			try {
				wasmtables[i] = new WebAssembly.Table({element: "anyfunc", initial: seed8, maximum: seed8});
			} catch(exc){
				console.warn("[FUZZCUS][WTABLE_CREATE]: "+exc.message);
			}
			s_next(8);
		}

		console.info("[FUZZCUS]: Creating WASM memories...");
		var wasmrams = new Array(CYCLEDEPTH);
		for(i = 0; i < CYCLEDEPTH; i++){
			try {
				if(this.genBool())
					wasmrams[i] = new WebAssembly.Memory({initial:seed8, maximum:seed8});
				else
					wasmrams[i] = new WebAssembly.Memory({initial: seed8});
			} catch(exc){
				console.warn("[FUZZCUS][WMEM_CREATE]: "+exc.message);
			}
			s_next(8);
		}

		console.info("[FUZZCUS]: Creating WASM modules...");
		var wasmmodules = new Array(CYCLEDEPTH);
		wasmmodules.fill(new WebAssembly.Module(wasm_basic_module));

		console.info("[FUZZCUS]: Creating WASM instances...");
		var wasminstances = new Array(CYCLEDEPTH);
		for(i = 0; i < CYCLEDEPTH; i++) {

			var contents = this.genBool() + this.genBool() + this.genBool();
			var rmod = wasmmodules[this.toInt(Math.random() * wasmmodules.length - 1)];

			if( contents == 3 ) // global
			{
				try {
					var rglobal = wasmglobals[this.toInt(Math.random() * wasmglobals.length)];
					wasminstances[i] = new WebAssembly.Instance(rmod, {
						js: { rglobal }
					});
				} 
				catch (exc) {
					console.warn("[FUZZCUS][WASM_INSTANCE/GLOBAL]: "+exc.message);
				}
			}
			else if( contents == 2 ) { // ram
				try {
					var rmem = wasmrams[this.toInt(Math.random() * wasmrams.length)];
					wasminstances[i] = new WebAssembly.Instance(rmod, {
						js: { rmem }
					});
		        }
				catch (exc) {
					console.warn("[FUZZCUS][WASM_INSTANCE/GLOBAL]: "+exc.message);
				}
			}
			else if( contents == 1 ) { // table
				try {
					var rtable = wasmtables[this.toInt(Math.random() * wasmtables.length)];
					wasminstances[i] = new WebAssembly.Instance(rmod, {
						js: { rtable }
					});
		        }
				catch (exc) {
					console.warn("[FUZZCUS][WASM_INSTANCE/GLOBAL]: "+exc.message);
				}
			}
			else { // no content
				try {
					wasminstances[i] = new WebAssembly.Instance(rmod, {});
				} catch (exc) {
					console.warn("[FUZZCUS][WASM_INSTANCE/GLOBAL]: "+exc.message);
				}
			}

		}

		console.warn("[FUZZCUS]: Fuzzing can start now!");
		console.info("[FUZZCUS][END][CYCLE "+CYCLES+"]: SEED8: "+seed8+" SEED16: "+seed16+" SEED32: "+seed32+" SEEDFLOAT: "+seedfloat);

		CYCLES--;

	}

	TGT("[FUZCUS]: Done fuzzing.");


}
