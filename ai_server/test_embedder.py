"""임베딩 모델 테스트"""
from sentence_transformers import SentenceTransformer
import sys

try:
    print("📥 임베딩 모델 로딩 중...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    print("✅ 모델 로딩 성공!")
    
    print("\n🧪 테스트 인코딩...")
    text = "승인된 품의서는 몇 건이야?"
    vector = model.encode([text])
    print(f"✅ 인코딩 성공! 벡터 크기: {vector.shape}")
    
    print("\n🎉 RAG 준비 완료!")
    sys.exit(0)
    
except Exception as e:
    print(f"❌ 오류: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)






















