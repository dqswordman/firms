import pytest
from fastapi import HTTPException

from utils.http_exceptions import HTTPExceptionFactory
from main import _parse_date


def test_http_exception_factory_structure():
    exc = HTTPExceptionFactory.bad_request("oops", {"x": 1})
    assert isinstance(exc, HTTPException)
    assert exc.status_code == 400
    assert exc.detail == {"code": 400, "message": "oops", "details": {"x": 1}}


def test_parse_date_invalid_format():
    with pytest.raises(HTTPException) as exc_info:
        _parse_date("20240101")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == 400
