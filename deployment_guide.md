# 🚀 YouArePlan EasyTax v8 배포 가이드

## 📋 배포 전 체크리스트

- [ ] OpenAI API 키 준비 (https://platform.openai.com/api-keys)
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 설정 (프로덕션용)
- [ ] 도메인 및 SSL 인증서 준비 (옵션)

---

## 🌐 Render.com 배포 (추천)

### 1. 자동 배포 설정
```bash
# GitHub 리포지토리에 코드 푸시
git init
git add .
git commit -m "YouArePlan EasyTax v8 초기 배포"
git push origin main
```

### 2. Render.com 설정
1. [Render.com](https://render.com) 가입 및 GitHub 연결
2. `render.yaml` 파일이 자동 인식됨
3. 환경 변수에서 `OPENAI_API_KEY` 설정
4. 배포 완료 후 URL 확인

### 3. 배포 후 확인
- API 서버: `https://youareplan-easytax-api.onrender.com/health`
- UI: `https://youareplan-easytax-ui.onrender.com`
- API 문서: `https://youareplan-easytax-api.onrender.com/docs`

---

## ☁️ Vercel 배포

### 1. Vercel CLI 설치 및 배포
```bash
npm install -g vercel
cd tax-mvp-spec-v8
vercel --prod
```

### 2. 환경 변수 설정
```bash
vercel env add OPENAI_API_KEY production
vercel env add DATABASE_URL production
```

### 3. 자동 배포
- `vercel.json` 설정 파일로 자동 배포
- GitHub 연동 시 푸시마다 자동 배포

---

## 🐳 Docker 배포

### 1. 로컬 Docker 빌드
```bash
cd tax-mvp-spec-v8
docker build -t youareplan/easytax:v8 .
docker run -p 8080:8080 --env-file .env youareplan/easytax:v8
```

### 2. Docker Compose 배포 (전체 스택)
```bash
# .env 파일에 OpenAI API 키 설정
echo "OPENAI_API_KEY=your_api_key_here" >> .env

# 전체 스택 실행
docker-compose up -d

# 상태 확인
docker-compose ps
docker-compose logs youareplan-api
```

### 3. 클라우드 배포 (AWS ECS, Google Cloud Run)
```bash
# Docker Hub에 이미지 푸시
docker tag youareplan/easytax:v8 youareplan/easytax:latest
docker push youareplan/easytax:v8
docker push youareplan/easytax:latest

# Google Cloud Run 배포
gcloud run deploy youareplan-easytax \
  --image youareplan/easytax:v8 \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "APP_NAME=YouArePlan EasyTax,APP_VERSION=v8"
```

---

## 🌍 Netlify 배포 (UI만)

### 1. UI 정적 배포
```bash
cd ui
npm install -g netlify-cli
netlify deploy --prod --dir .
```

### 2. 자동 배포 설정
```yaml
# netlify.toml
[build]
  publish = "ui"
  command = "echo 'No build needed'"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

[[redirects]]
  from = "/api/*"
  to = "https://youareplan-easytax-api.onrender.com/api/:splat"
  status = 200
```

---

## 🔒 환경 변수 설정

### 필수 환경 변수
```bash
# OpenAI API (필수)
OPENAI_API_KEY=sk-your-api-key-here

# 애플리케이션 설정
APP_NAME="YouArePlan EasyTax - 세무 AI 코파일럿"
APP_VERSION=v8
ENVIRONMENT=production

# 데이터베이스 (프로덕션)
DATABASE_URL=postgresql://user:password@host:port/database

# 보안
SECRET_KEY=your-secure-secret-key
ALLOWED_ORIGINS=https://yourdomain.com

# 파일 업로드
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=csv,xlsx,xls
```

### 플랫폼별 환경 변수 설정

**Render.com:**
- 대시보드 → Service → Environment → Add Environment Variable

**Vercel:**
```bash
vercel env add OPENAI_API_KEY production
```

**Docker:**
```bash
# .env 파일 생성
cp .env.example .env
# 필요한 값들 수정
```

---

## 📊 모니터링 및 로깅

### 1. 상태 확인 엔드포인트
```bash
# 서버 상태
curl https://your-domain.com/health

# API 키 검증
curl https://your-domain.com/api/validate-key

# API 상태
curl https://your-domain.com/api/status
```

### 2. 로그 모니터링
```bash
# Render
render logs --service youareplan-easytax-api

# Docker
docker logs youareplan-easytax-api

# Vercel
vercel logs --project youareplan-easytax
```

### 3. 성능 모니터링
- API 응답 시간 모니터링
- 데이터베이스 연결 상태
- OpenAI API 사용량 및 비용

---

## 🔧 문제 해결

### 일반적인 배포 오류

1. **포트 바인딩 오류**
   ```bash
   # 해결: --host 0.0.0.0 사용
   uvicorn api.main:app --host 0.0.0.0 --port $PORT
   ```

2. **OpenAI API 키 오류**
   ```bash
   # 확인: API 키 설정 상태
   curl https://your-domain.com/api/validate-key
   ```

3. **데이터베이스 연결 오류**
   ```bash
   # 확인: DATABASE_URL 형식
   postgresql://username:password@hostname:port/database_name
   ```

4. **CORS 오류**
   ```python
   # main.py에서 CORS 설정 확인
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-domain.com"]
   )
   ```

### 성능 최적화

1. **Gunicorn 사용 (프로덕션)**
   ```bash
   pip install gunicorn
   gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

2. **데이터베이스 최적화**
   ```python
   # SQLAlchemy 연결 풀 설정
   DATABASE_URL = "postgresql://...?pool_size=20&max_overflow=0"
   ```

3. **Redis 캐싱 (옵션)**
   ```bash
   pip install redis fastapi-cache
   ```

---

## 📞 지원 및 문의

배포 관련 문의사항:
- **웹사이트**: youareplan.co.kr
- **이메일**: contact@youareplan.co.kr
- **기술지원**: 24시간 모니터링 및 지원

---

**🎉 성공적인 배포를 위해 이 가이드를 단계별로 따라해주세요!**