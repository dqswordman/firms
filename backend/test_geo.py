import pytest
import pytest
from services import geo


def test_validate_country():
    assert geo.validate_country("USA")
    assert not geo.validate_country("ZZZ")
    assert not geo.validate_country("us")


def test_country_to_bbox_parses_box():
    bbox = geo.country_to_bbox("USA")
    assert bbox is not None
    assert bbox == pytest.approx(
        (-179.143503384, 18.9061171430001, 179.780935092, 71.4125023460001)
    )
