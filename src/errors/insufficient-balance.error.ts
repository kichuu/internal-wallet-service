import { HttpException } from "./http-exception";

export class InsufficientBalanceError extends HttpException {
  constructor(message = "Insufficient balance") {
    super(422, message);
  }
}
