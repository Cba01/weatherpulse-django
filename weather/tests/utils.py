from unittest.mock import Mock


def fake_response(status_code=200, payload=None):
    """Stand-in for a requests.Response with only what services._get() uses."""
    return Mock(
        status_code=status_code,
        ok=200 <= status_code < 400,
        json=Mock(return_value=payload),
    )
