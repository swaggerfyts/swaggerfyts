export class SwaggerfyTsError extends Error {
  public readonly isSwaggerfyTsError = true;
  public readonly exactErrorName: string;
  public readonly text: string;

  constructor(message: string) {
    super(message);
    this.text = message; //to ensure during json.stringify this is visible
    this.exactErrorName = this.constructor.name;
  }
}
