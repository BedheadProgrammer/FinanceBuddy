from openai import OpenAI
from dotenv import load_dotenv
import os


load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not set. Check your .env file name and location.")

client = OpenAI(api_key=api_key)

response = client.responses.create(
    model="gpt-5-nano",
    input="Write a one-sentence bedtime story about a unicorn.",
)

print(response.output_text)
z