from slowapi import Limiter
from slowapi.util import get_remote_address
# Define the limiter using remote address as default key
limiter = Limiter(key_func=get_remote_address)