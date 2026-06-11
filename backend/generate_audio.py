from gtts import gTTS
import os

text = "Hello, please give me twenty kilos of tomatoes and fifteen kilos of onion."
tts = gTTS(text=text, lang='en')
tts.save("test_order.mp3")
print("Saved test_order.mp3")
