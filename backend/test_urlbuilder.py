from datetime import date

from utils.urlbuilder import build_country_url, build_area_url, compose_urls


def test_build_country_url_with_and_without_date():
    url = build_country_url("K", "MODIS_NRT", "USA", 5, date(2024, 1, 1))
    assert (
        url
        == "https://firms.modaps.eosdis.nasa.gov/api/country/csv/"
        "K/MODIS_NRT/USA/5/2024-01-01"
    )

    url = build_country_url("K", "MODIS_NRT", "USA", 5)
    assert (
        url
        == "https://firms.modaps.eosdis.nasa.gov/api/country/csv/"
        "K/MODIS_NRT/USA/5"
    )


def test_build_area_url_world_and_bbox():
    url = build_area_url("K", "MODIS_NRT", "world", 1)
    assert (
        url
        == "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        "K/MODIS_NRT/world/1"
    )

    url = build_area_url("K", "MODIS_NRT", (-10.0, -20.0, 30.5, 40.2), 3, date(2024, 2, 15))
    assert (
        url
        == "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        "K/MODIS_NRT/-10.0,-20.0,30.5,40.2/3/2024-02-15"
    )


def test_compose_urls_cross_month_and_year():
    urls = compose_urls(
        map_key="K",
        source="MODIS_NRT",
        start=date(2023, 12, 25),
        end=date(2024, 1, 8),
        area=(-10.0, -20.0, 30.5, 40.2),
    )
    assert urls == [
        "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        "K/MODIS_NRT/-10.0,-20.0,30.5,40.2/10/2023-12-25",
        "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        "K/MODIS_NRT/-10.0,-20.0,30.5,40.2/5/2024-01-04",
    ]

    urls = compose_urls(
        map_key="K",
        source="MODIS_NRT",
        start=date(2024, 1, 28),
        end=date(2024, 2, 2),
        country="USA",
    )
    assert urls == [
        "https://firms.modaps.eosdis.nasa.gov/api/country/csv/"
        "K/MODIS_NRT/USA/6/2024-01-28"
    ]
