const { app } = require("./app");
const { env } = require("./config/env");

app.listen(env.port, () => {
  console.log(`API disponible en http://localhost:${env.port}`);
});
