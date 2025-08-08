from fastapi import HTTPException
from typing import Any, Optional


class HTTPExceptionFactory:
    """Factory to create HTTPException with unified structure."""

    @staticmethod
    def create(status_code: int, message: str, details: Optional[Any] = None) -> HTTPException:
        return HTTPException(status_code, {"code": status_code, "message": message, "details": details})

    @classmethod
    def bad_request(cls, message: str, details: Optional[Any] = None) -> HTTPException:
        return cls.create(400, message, details)

    @classmethod
    def bad_gateway(cls, message: str, details: Optional[Any] = None) -> HTTPException:
        return cls.create(502, message, details)

    @classmethod
    def service_unavailable(cls, message: str, details: Optional[Any] = None) -> HTTPException:
        return cls.create(503, message, details)

    @classmethod
    def gateway_timeout(cls, message: str, details: Optional[Any] = None) -> HTTPException:
        return cls.create(504, message, details)
