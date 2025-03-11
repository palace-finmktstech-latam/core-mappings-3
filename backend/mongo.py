from pymongo.mongo_client import MongoClient
import certifi
import ssl

uri = "mongodb+srv://benclark:IDTJTZ5uAUSD0yfl@palaceai.kgogr.mongodb.net/?retryWrites=true&w=majority&appName=PalaceAI"

# More compatible TLS configuration
client = MongoClient(
    uri,
    tls=True,
    tlsCAFile=certifi.where(),
    tlsAllowInvalidCertificates=True  # Temporary for testing
)

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)