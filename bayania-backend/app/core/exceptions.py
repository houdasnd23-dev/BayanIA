from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://bayan-ia-eight.vercel.app",
    "https://bayan-ia-ho20.vercel.app",
]


def add_cors_headers(response, request: Request):
    origin = request.headers.get("origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


class BayanException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthenticationException(BayanException):
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationException(BayanException):
    def __init__(self, message: str = "Not enough permissions"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class NotFoundException(BayanException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class InvalidRequestException(BayanException):
    def __init__(self, message: str = "Invalid request"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(BayanException)
    async def bayan_exception_handler(request: Request, exc: BayanException):
        response = JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {"message": exc.message, "type": exc.__class__.__name__},
            },
        )
        return add_cors_headers(response, request)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        response = JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {"message": f"An unexpected error occurred: {str(exc)}", "type": "InternalServerError"},
            },
        )
        return add_cors_headers(response, request)