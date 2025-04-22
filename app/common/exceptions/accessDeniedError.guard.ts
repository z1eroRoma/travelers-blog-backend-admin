export class AccessDeniedError extends Error {
    statusCode: number;

    constructor(message = "Forbidden: You are not allowed to perform this action") {
        super(message);
        this.name = "AccessDeniedError";
        this.statusCode = 403;
    }
}
