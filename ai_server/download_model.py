"""
임베딩 모델 수동 다운로드 스크립트
"""
import os
import requests
from pathlib import Path

# 모델 정보
MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
BASE_URL = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main"

# 다운로드할 파일 목록
FILES = [
    "config.json",
    "config_sentence_transformers.json",
    "modules.json",
    "pytorch_model.bin",
    "sentence_bert_config.json",
    "special_tokens_map.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.txt",
    "1_Pooling/config.json"
]

# 저장 경로
CACHE_DIR = Path.home() / ".cache" / "huggingface" / "hub" / "models--sentence-transformers--all-MiniLM-L6-v2" / "snapshots" / "main"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Pooling 디렉토리
POOLING_DIR = CACHE_DIR / "1_Pooling"
POOLING_DIR.mkdir(parents=True, exist_ok=True)

print(f"📂 저장 경로: {CACHE_DIR}")
print("=" * 70)

# SSL 검증 우회
import ssl
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 다운로드 함수
def download_file(filename):
    url = f"{BASE_URL}/{filename}"
    
    # 저장 경로
    if filename.startswith("1_Pooling/"):
        save_path = POOLING_DIR / filename.split("/")[-1]
    else:
        save_path = CACHE_DIR / filename
    
    # 이미 있으면 스킵
    if save_path.exists():
        print(f"✅ {filename} (이미 존재)")
        return True
    
    try:
        print(f"⬇️  {filename} 다운로드 중...", end=" ")
        
        # SSL 검증 우회하여 다운로드
        response = requests.get(url, verify=False, timeout=60, stream=True)
        
        if response.status_code == 200:
            total_size = int(response.headers.get('content-length', 0))
            
            with open(save_path, 'wb') as f:
                if total_size > 0:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            # 진행률 표시 (큰 파일용)
                            if total_size > 1024 * 1024:  # 1MB 이상
                                progress = (downloaded / total_size) * 100
                                print(f"\r⬇️  {filename} 다운로드 중... {progress:.1f}%", end="")
                else:
                    f.write(response.content)
            
            print(f"\r✅ {filename} 다운로드 완료!             ")
            return True
        else:
            print(f"\r❌ {filename} 다운로드 실패 (Status: {response.status_code})")
            return False
            
    except Exception as e:
        print(f"\r❌ {filename} 오류: {e}")
        return False

# 모든 파일 다운로드
print("\n📥 모델 파일 다운로드 시작...")
print("=" * 70)

success_count = 0
for file in FILES:
    if download_file(file):
        success_count += 1

print("\n" + "=" * 70)
print(f"✅ 완료! {success_count}/{len(FILES)} 파일 다운로드 성공")

if success_count == len(FILES):
    print("\n🎉 모든 파일이 성공적으로 다운로드되었습니다!")
    print(f"📂 위치: {CACHE_DIR}")
    print("\n다음 명령으로 서버를 실행하세요:")
    print("  python main_texttosql_rag.py")
else:
    print("\n⚠️  일부 파일 다운로드 실패")
    print("다시 시도하거나 수동으로 다운로드하세요:")
    print("  https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/main")
















