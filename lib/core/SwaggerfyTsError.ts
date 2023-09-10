export class SwaggerfyTsError extends Error {
  public readonly isSwaggerfyTsError = true;
  public readonly exactErrorName: string;

  constructor(public readonly text: string) {
    //to ensure during json.stringify this is visible
    super(text);
    this.exactErrorName = this.constructor.name;
  }
}
