from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class BayanException(Exception):
    """Base exception class for BayanIA application."""

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
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "message": exc.message,
                    "type": exc.__class__.__name__,
                },
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "message": f"An unexpected error occurred: {str(exc)}",
                    "type": "InternalServerError",
                },
            },
        )