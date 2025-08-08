import pytest
from services import geo


def test_validate_country(monkeypatch):
    mock = {"USA": (-179.1, 18.9, 179.7, 71.4)}
    monkeypatch.setattr(geo, "load_countries", lambda cache_ttl=86400: mock)
    assert geo.validate_country("USA")
    assert not geo.validate_country("ZZZ")
    assert not geo.validate_country("us")


def test_country_to_bbox_parses_box(monkeypatch):
    mock = {"USA": (-179.143503384, 18.9061171430001, 179.780935092, 71.4125023460001)}
    monkeypatch.setattr(geo, "load_countries", lambda cache_ttl=86400: mock)
    bbox = geo.country_to_bbox("USA")
    assert bbox is not None
    assert bbox == pytest.approx(
        (-179.143503384, 18.9061171430001, 179.780935092, 71.4125023460001)
    )
