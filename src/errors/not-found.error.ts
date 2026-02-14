import { HttpException } from "./http-exception";

export class NotFoundError extends HttpException {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}
