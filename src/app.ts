import express from "express";
import routes from "./routes";
import { errorHandler } from "./middleware/error-handler.middleware";
import { requestId } from "./middleware/request-id.middleware";

const app = express();

app.use(express.json());
app.use(requestId);

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
