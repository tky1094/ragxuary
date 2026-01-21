"""OpenAPI customization utilities."""

from fastapi.routing import APIRoute


def generate_simple_operation_id(route: APIRoute) -> str:
    """Generate simple operation ID using the function name.

    This produces cleaner SDK method names like:
    - login instead of loginApiV1AuthLoginPost
    - register instead of registerApiV1AuthRegisterPost
    """
    return route.name
