# Yoon Suro · Web Publisher Portfolio

사용자 경험을 고민하며 직관적이고 편리한 웹 페이지를 만드는 웹 퍼블리셔 **윤수로**의 포트폴리오입니다.

웹·앱 브랜딩과 웹사이트 리디자인, React 프로젝트, 3D 전시와 일상에서 필요한 도구를 만든 바이브 코딩 프로젝트를 담았습니다. 반응형 레이아웃과 스크롤 인터랙션을 통해 각 작업의 화면과 내용을 살펴볼 수 있도록 구성했습니다.

**[포트폴리오 바로가기](https://tnfh23-web.github.io/)** · [GitHub](https://github.com/tnfh23-web) · [개발 블로그](https://velog.io/@ghggh23/posts)

## 페이지 구성

| 섹션 | 내용 |
| --- | --- |
| HOME | 자기소개와 회전하는 원형 텍스트 인터랙션 |
| ABOUT ME | 프로필, 웹·인터랙션 기술, 교육 및 실무·프로젝트 경험 |
| PROJECT | 팀 브랜딩 프로젝트와 개인 웹사이트 리디자인 |
| FRONT PROJECT | React로 제작한 MODOO 프로젝트와 실제 사이트 미리보기 |
| VIBE PROJECT | AFTERIMAGE 3D 전시, 업데이트 아카이브, 여행 체크리스트, 웹페이지 제작 가이드 |
| CONTACT | 연락처와 GitHub·개발 블로그 링크 |

## 수록 프로젝트

### 브랜딩 · 리디자인

| 프로젝트 | 구분 | 소개 | 링크 |
| --- | --- | --- | --- |
| Kumu | 팀 · 웹 브랜딩 | 반려견과 보호자가 함께하는 애견 카페의 반응형 웹사이트 | [Web](https://tnfh23-web.github.io/kumu/) |
| EATGO | 팀 · 앱 브랜딩 | 일상의 소비 데이터를 바탕으로 식습관 관리를 돕는 서비스 | [Process](https://r00neyj.github.io/Eatgo_Process/) |
| 스타스케이프 | 개인 · 리디자인 | 프라이빗한 휴식 경험을 전달하는 반응형 웹사이트 | [Web](https://tnfh23-web.github.io/star_251008/) |
| 건일제약 | 개인 · 리디자인 | 의약 정보의 전달력과 기업의 전문성을 고려한 웹사이트 | [Web](https://tnfh23-web.github.io/KUHNIL/) |

### 프론트엔드

**[MODOO](https://tnfh23-web.github.io/react-modoo/)** — 웹에이전시 MODOO를 주제로 제작한 개인 리디자인 프로젝트입니다. React 컴포넌트로 화면을 구성하고 GSAP, Swiper, AOS를 활용해 인터랙션을 구현했습니다. 포트폴리오 안에서도 iframe으로 실제 사이트를 살펴볼 수 있습니다.

### 바이브 코딩

공간과 인터랙션을 실험한 3D 전시부터 생활과 작업 과정에서 필요한 도구까지, 바이브 코딩으로 제작한 개인 프로젝트입니다.

| 프로젝트 | 만든 목적 | 링크 |
| --- | --- | --- |
| AFTERIMAGE · 잔상 | 공간을 직접 이동하며 조각을 회전하고 회화를 가까이 감상하는 가상의 3D 전시 | [Web](https://tnfh23-web.github.io/afterimage/) · [Process](https://tnfh23-web.github.io/afterimage/#about) |
| Codex · ChatGPT 업데이트 소식 | 두 제품의 공식 업데이트를 읽기 쉬운 한국어로 정리하고 한곳에서 확인하기 | [Web](https://tnfh23-web.github.io/codexup/) |
| Japan Travel Checklist | 첫 해외여행을 준비하며 챙겨야 할 항목을 한눈에 확인하기 | [Web](https://tnfh23-web.github.io/japan-travel-checklist/) |
| Web Production Guide | 웹페이지를 만들면서 놓치기 쉬운 내용을 모아 확인하기 | [Web](https://tnfh23-web.github.io/codex-web-test/) |

**AFTERIMAGE · 잔상**은 풍부한 인터랙션과 콘텐츠에 맞는 공간 경험을 실험하기 위해 제작했습니다. 밝은 중앙 채광 홀에서 이어지는 10개의 전시실에서 조각과 회화 총 20점을 감상하고, 2층 상영관에서는 약 48초의 오리지널 영상 ‘여운의 문’을 볼 수 있습니다. 작품을 직접 회전하거나 회화를 확대하고, 벤치와 상영관 좌석에 앉아 공간에 머물 수 있습니다. 모바일 조이스틱과 점프, 서서히 전진하는 입장 연출, 사운드와 음량 조절, 기획·제작 과정을 소개하는 페이지를 함께 구성했습니다.

React로 관람 화면과 상태를 구성하고, Three.js로 전시 공간과 작품을 렌더링했으며, Vite로 개발·빌드했습니다. 전시 프로젝트는 [별도 저장소](https://github.com/tnfh23-web/afterimage)에서 관리하며, 이 포트폴리오에는 최신 실제 화면과 관람 링크를 연결했습니다.

## 구현 특징

- **반응형 화면 구성**: 데스크톱과 모바일에 맞춰 레이아웃과 내비게이션을 전환합니다. 메인 프로젝트 목록은 데스크톱에서 스크롤에 따라 접히고, 모바일에서는 펼쳐진 상태로 표시됩니다.
- **스크롤에 반응하는 모션**: GSAP과 ScrollTrigger로 프로젝트 전환, 제목 등장, 흐르는 텍스트를 구현하고 Lenis를 연결해 스크롤 흐름을 조정했습니다.
- **프로젝트 미리보기**: React 프로젝트는 실제 사이트를 삽입하고, 바이브 프로젝트는 배경 이미지와 썸네일을 함께 배치해 작업 화면을 보여줍니다.
- **바이브 프로젝트 순차 전환**: AFTERIMAGE → 업데이트 소식 → 여행 체크리스트 → 제작 가이드 순으로 전환하며, 프로젝트 개수에 맞춰 스크롤 구간을 계산합니다.
- **동작 감소 설정 반영**: `prefers-reduced-motion` 설정 시 프론트엔드 프로젝트의 등장 모션을 생략하고, 바이브 프로젝트는 전환 없이 모두 표시합니다.

## 사용 기술

이 저장소의 포트폴리오는 **HTML, CSS, JavaScript로 구성한 정적 사이트**입니다.

| 기술 | 용도 |
| --- | --- |
| HTML | 페이지 구조, 프로젝트 소개, 외부 사이트 미리보기 |
| CSS | 반응형 레이아웃, 공통 색상·너비 변수, 스타일과 전환 효과 |
| JavaScript | 모바일 메뉴, 로딩 제어, 인터랙션 상태 관리 |
| GSAP · ScrollTrigger · SplitText | 스크롤 연동 애니메이션과 글자 단위 제목 효과 |
| Lenis | 부드러운 스크롤과 ScrollTrigger 연동 |
| AOS | 요소의 등장 효과 |
| GitHub Pages | 정적 사이트 배포 |

## 파일 구조

```text
.
├── index.html       # 소개, 프로젝트, 연락처 등 페이지 콘텐츠
├── style.css        # 섹션별 스타일과 반응형 레이아웃
├── variable.css     # 공통 색상과 최대 너비 변수
├── script.js        # 스크롤 애니메이션과 사용자 인터랙션
├── font/            # 로컬 폰트
├── img/
│   ├── about-img/          # 프로필 이미지
│   ├── project-img/        # 브랜딩·리디자인 프로젝트 이미지
│   ├── thum-img/           # 공유용 썸네일
│   └── vibe-project-img/   # 바이브 프로젝트 배경과 썸네일
└── README.md
```

## 로컬에서 보기

저장소를 내려받은 뒤 `index.html`을 브라우저에서 열거나, VS Code의 Live Server 등 로컬 정적 서버로 실행할 수 있습니다. 별도의 패키지 설치나 빌드 과정은 없습니다.

외부 CDN에서 불러오는 라이브러리와 프로젝트 미리보기를 표시하려면 인터넷 연결이 필요합니다.

## 연락처

- Email: [tnfh23@gmail.com](mailto:tnfh23@gmail.com)
- GitHub: [tnfh23-web](https://github.com/tnfh23-web)
- Blog: [개발 기록](https://velog.io/@ghggh23/posts)

이 사이트는 상업적 목적이 아닌 개인 포트폴리오용으로 제작되었습니다.
