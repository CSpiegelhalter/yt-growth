import re, string
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

def normalize(text):
    text = text.lower()
    text = re.sub(r'https?\S+', '', text)         # remove URLs
    text = re.sub(f'[{string.punctuation}]', '', text)
    text = ' '.join(w for w in text.split() if w not in ENGLISH_STOP_WORDS)
    return text
