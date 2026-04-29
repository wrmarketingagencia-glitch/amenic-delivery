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
// No deploy via GitHub (auto-deploy Hostinger), o servidor standalone fica em .next/standalone/
// No deploy via rsync (standalone copiado para a raiz), server.js fica em ./server.js
const path = require("path")
const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js")
const rootServer = path.join(__dirname, "server.js")
const fs = require("fs")
if (fs.existsSync(standaloneServer)) {
  require(standaloneServer)
} else if (fs.existsSync(rootServer)) {
  require(rootServer)
} else {
  console.error("[app.js] server.js não encontrado em:", standaloneServer, "nem em:", rootServer)
  process.exit(1)
}
