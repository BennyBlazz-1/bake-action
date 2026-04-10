const app = require('./app');

const PORT = Number(process.env.PORT || 3000);

function startServer() {
  return app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };