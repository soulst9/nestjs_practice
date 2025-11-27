## 🚀 Getting Started

### Required Environment Variables
NODE Version: Node 20+ (LTS 권장)

### Installation & Run
```bash
npm install
chmod +x ./local-run.sh 
./local-run.sh
```

## 📂 Project Structure

```
/ (repo root)
├── src/                                  # 애플리케이션 소스
│   ├── common/                           # 공통 코드
│   │   ├── decorators/                   # 커스텀 데코레이터
│   │   ├── enums/                        # 열거형 정의
│   │   ├── interfaces/                   # 공용 인터페이스
│   │   └── redis/                        # Redis 모듈/서비스
│   ├── modules/                          # 도메인 모듈
│   │   ├── auth/                         # 인증/인가
│   │   │   ├── guards/                   # 접근 제어 가드
│   │   │   ├── providers/                # SSO 제공자 구현
│   │   │   └── strategies/               # Passport 전략
│   └── (루트 파일들: main.ts 등은 트리에서 생략)
├── libs/                                 # 라이브러리/공유 코드
│   └── shared/
│       └── interfaces/
└── 
```

## ⭐ Swagger
http://localhost:3000/api/docs
