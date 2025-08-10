# GitHub 리포지토리 설정 가이드

## 1. GitHub 리포지토리 생성

### 웹 브라우저에서 생성
1. [GitHub](https://github.com)에 로그인
2. 우상단 "+" 버튼 클릭 → "New repository" 선택
3. 리포지토리 설정:
   - **Repository name**: `obdoc`
   - **Description**: `의료진과 환자를 위한 통합 플랫폼`
   - **Visibility**: Private (권장) 또는 Public
   - **Initialize this repository with**: 체크하지 않음 (이미 로컬에 코드가 있음)
4. "Create repository" 클릭

### 명령어로 생성 (GitHub CLI 사용)
```bash
# GitHub CLI 설치 후
gh repo create obdoc --private --description "의료진과 환자를 위한 통합 플랫폼"
```

## 2. 로컬 리포지토리와 연결

```bash
# 리모트 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/obdoc.git

# 기본 브랜치 설정
git branch -M main

# 첫 번째 푸시
git push -u origin main
```

## 3. 브랜치 전략 설정

### 권장 브랜치 구조
- `main`: 프로덕션 배포용 (안정적인 코드만)
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 브랜치 생성
```bash
# 개발 브랜치 생성
git checkout -b develop
git push -u origin develop
```

## 4. GitHub 설정

### 브랜치 보호 규칙 설정
1. Repository → Settings → Branches
2. "Add rule" 클릭
3. Branch name pattern: `main`
4. 다음 옵션 활성화:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

### Secrets 설정 (환경 변수)
1. Repository → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 다음 시크릿들 추가:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-key
CLAUDE_API_KEY=your-claude-key
GOOGLE_AI_API_KEY=your-google-ai-key
```

## 5. GitHub Actions 워크플로우

### 자동 배포 설정
`.github/workflows/deploy.yml` 파일이 자동으로 생성됩니다.

### 워크플로우 기능
- ✅ 코드 푸시 시 자동 빌드
- ✅ 테스트 실행
- ✅ Netlify 자동 배포
- ✅ 빌드 상태 알림

## 6. 다음 단계

리포지토리 생성 완료 후:
1. ✅ 코드 푸시 확인
2. ✅ GitHub Actions 워크플로우 실행 확인
3. ✅ Netlify 연동 설정
4. ✅ 팀원 초대 및 권한 설정
5. ✅ 첫 번째 이슈 및 PR 생성

---

**참고**: 실제 API 키와 시크릿 값들은 절대 코드에 포함하지 말고, GitHub Secrets를 통해서만 관리하세요.