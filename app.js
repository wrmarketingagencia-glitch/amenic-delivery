// Hostinger Passenger entry point
// Respawn com UV_THREADPOOL_SIZE=1 ANTES do libuv inicializar
if (!process.env._AMENIC_SPAWNED) {
  const { spawn } = require("child_process")
  const child = spawn(process.execPath, [__filename], {
    env: {
      ...process.env,
      UV_THREADPOOL_SIZE: "1",
      NODE_OPTIONS: "--max-old-space-size=256 --single-threaded-gc",
      _AMENIC_SPAWNED: "1",
    },
    stdio: "inherit",
  })
  child.on("exit", (code) => process.exit(code ?? 0))
  return
}

// Processo filho — libuv já foi inicializado com UV_THREADPOOL_SIZE=1
require("./server.js")
