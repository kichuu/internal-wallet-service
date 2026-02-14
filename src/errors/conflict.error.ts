import { HttpException } from "./http-exception";

export class ConflictError extends HttpException {
  constructor(message = "Conflict") {
    super(409, message);
  }
}
