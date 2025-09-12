import requests

text = "作業が終わったわよ。さっさと次へ行きなさい。"
params = {
    "text": text,
    "alpha": 0.3,
    "beta": 0.7,
    "format": "wav"
}

url = "https://tsubasa.dev-livetoon.com/tts"
headers = {"Accept": "audio/wav"}

res = requests.post(url, params=params, headers=headers)

if res.status_code == 200:
    with open("done.wav", "wb") as f:
        f.write(res.content)
    print("✅ done.wav saved")
else:
    print("❌ Error:", res.status_code, res.text)
