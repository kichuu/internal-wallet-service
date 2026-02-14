import app from "./app";
import { config } from "./config/configuration";

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Wallet service running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});
