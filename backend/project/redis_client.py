import redis

# Initialize Redis client with Docker URL
redis_client = redis.StrictRedis.from_url('redis://redis', decode_responses=True)