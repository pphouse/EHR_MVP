#!/usr/bin/env python3
import requests
import subprocess
import sys
import os

def notify_completion(message="作業が完了しました。確認をお願いします。"):
    """Claude Codeの作業完了を音声で通知する"""
    print(f"🔊 音声通知を生成中: {message}")
    
    params = {
        "text": message,
        "alpha": 0.3,
        "beta": 0.7,
        "format": "wav"
    }
    
    url = "https://tsubasa.dev-livetoon.com/tts"
    headers = {"Accept": "audio/wav"}
    
    try:
        res = requests.post(url, params=params, headers=headers)
        
        if res.status_code == 200:
            # 音声ファイルを保存
            audio_file = "claude_notification.wav"
            with open(audio_file, "wb") as f:
                f.write(res.content)
            
            print(f"✅ 音声ファイル生成完了: {audio_file}")
            
            # macOSで音声を再生
            try:
                subprocess.run(["afplay", audio_file], check=True)
                print("🔊 音声通知を再生しました")
            except subprocess.CalledProcessError:
                print("⚠️ 音声再生に失敗しました（afplayが利用できません）")
            except FileNotFoundError:
                print("⚠️ 音声再生に失敗しました（afplayが見つかりません）")
                
        else:
            print(f"❌ TTS API エラー: {res.status_code} {res.text}")
            
    except requests.RequestException as e:
        print(f"❌ ネットワークエラー: {e}")
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")

if __name__ == "__main__":
    # コマンドライン引数でメッセージをカスタマイズ可能
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
    else:
        message = "作業が完了しました。確認をお願いします。"
    
    notify_completion(message)