import asyncio
import os
import sys

# load key from .env manually
with open("backend/.env", "r") as f:
    for line in f:
        if line.startswith("GROQ_API_KEY="):
            os.environ["GROQ_API_KEY"] = line.split("=", 1)[1].strip()

sys.path.insert(0, './backend')
from services.llm_service import _groq_extract, EXTRACT_PROMPT

async def run():
    tests = [
        '500 kg tomato, 200 kg onion, 100 kg potato for restaurant',
        '<script>alert("xss")</script> 10 kg tomato',
        '20 kg टमाटर और 10 kg प्याज चाहिए',
        '10 kg tomato at Rs 30 per kg and 5 kg onion at 25 rupees',
        'I need 10 kg tomato, 5 kg onion, 3 kg potato, 2 kg garlic, 1 kg ginger, 4 dozen banana, 2 dozen lemon, 500g turmeric, 1 kg chilli, 2 bundle coriander, 1 bundle mint, 3 kg capsicum, 5 kg carrot, 2 kg beetroot, 1 kg radish for my restaurant tomorrow morning'
    ]
    for t in tests:
        prompt = EXTRACT_PROMPT.format(transcript=t)
        res = await _groq_extract(prompt)
        print(f"\n\n--- {t} ---")
        print(res)

asyncio.run(run())
