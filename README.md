# Yoon Suro · Web Publisher Portfolio

웹 퍼블리셔 **윤수로**의 개인 포트폴리오입니다.

프로필과 웹 퍼블리싱·프론트엔드 작업을 소개합니다. 주요 화면과 간단한 설명을 통해 작업을 살펴보고, 실제 사이트로 이동할 수 있습니다. 데스크톱과 모바일에 맞춘 반응형 레이아웃과 스크롤 인터랙션으로 구성했습니다.

**[포트폴리오 보기](https://tnfh23-web.github.io/)**

## 페이지 구성

| 섹션 | 내용 |
| --- | --- |
| HOME | 자기소개 |
| ABOUT ME | 프로필, 보유 기술, 교육과 경험 |
| PROJECT | 브랜딩과 웹사이트 리디자인 작업 |
| FRONT PROJECT | 프론트엔드 작업과 사이트 미리보기 |
| VIBE PROJECT | 바이브 코딩으로 제작한 개인 작업 |
| CONTACT | 연락처와 관련 링크 |

## 사용 기술

| 기술 | 용도 |
| --- | --- |
| HTML · CSS · JavaScript | 페이지 구성과 반응형 화면 |
| GSAP · ScrollTrigger · SplitText | 스크롤 인터랙션과 텍스트 애니메이션 |
| Lenis | 부드러운 스크롤 |
| GitHub Pages | 사이트 배포 |

## 파일 구조

```text
index.html
assets/
  icons/
    favicon-ys.svg      # 글꼴 없이 그린 YS 모노그램 원본
    apple-touch-icon.png # iOS 홈 화면용 아이콘 (180px)
  css/
    tokens.css          # 색상·최대 너비·공통 여백 변수
    main.css            # 기존 섹션과 로딩 스타일
    grid.css            # 헤더와 모든 섹션의 공통 정렬
    projects.css        # PROJECT 쇼케이스와 반응형
  js/
    main.js             # Lenis·초기화·섹션 연결·리사이즈
    project-showcase.js  # 캡슐 오프닝·스크롤 스택·공통 콘텐츠 등장
    loading-intro.js     # 타이포그래피 로딩
    page-reveals.js      # 텍스트·섹션 등장
    hero-playground.js   # 글자 호버·드래그
    portfolio-cursor.js  # 커스텀 커서
font/                   # 로컬 폰트
img/                    # 섹션별 이미지
tools/open-editor.bat    # 프로젝트 폴더를 에디터로 열기
favicon.ico             # 브라우저 호환용 16·32·48px 아이콘
```

파비콘은 Y의 세로획과 S의 아래 곡선을 연결한 흑백 모노그램입니다. SVG를 기본으로 사용하고 ICO를 호환용으로 제공하며, iOS 홈 화면에는 180px PNG를 사용합니다. 사이트의 본문·헤더·로딩 로고와 별도로 적용합니다.

공통 최대 너비는 `164rem`입니다. `tokens.css`의 `--grid-gutter`와 `--grid-width`를 `grid.css`에서 함께 사용해 HOME, ABOUT ME, PROJECT, FRONT, VIBE, CONTACT와 헤더를 정렬합니다. 배경과 마퀴는 의도적으로 전체 너비를 사용합니다.

PROJECT는 프로젝트별로 제작한 별도 배경 이미지 위에 실제 사이트 썸네일과 설명을 배치합니다. 작은 캡슐이 펼쳐지고, 스크롤하면 다음 카드가 아래에서 올라옵니다. 카드가 완전히 쌓이면 글자 마스크, 설명, 버튼과 썸네일이 스크롤 진행도와 독립된 시간 기반 애니메이션으로 자동 등장합니다. 스크롤을 멈춰도 등장효과는 끝까지 재생됩니다. 바로 이전 카드만 전환 중에 보이며, 역스크롤로 전체 과정이 복원됩니다. 모든 썸네일 프레임은 1.96:1로 통일하고 상단을 기준으로 표시합니다. 잇고는 제공받은 포스터의 상단을 넓게 보여줍니다. 이미지 링크와 호버, FRONT·VIBE와 공유하는 `.project-button`을 유지합니다.

VIBE 첫 화면은 기존 전체 화면 레이아웃과 내용을 바로 표시합니다. 이후 SVG 세로 블라인드가 번갈아 열리며 다음 프로젝트로 전환됩니다. 전환 완료 후 PROJECT와 같은 자동 콘텐츠 등장 함수를 사용합니다. 프로그레스 바는 없습니다. 리사이즈 시 타임라인, SplitText와 SVG 정의를 정리한 뒤 다시 생성합니다. 화면 높이가 부족하면 PROJECT는 CSS sticky 목록, VIBE는 일반 세로 목록을 사용하며, 모션 줄이기 환경에서는 모두 정적으로 표시합니다.

실제 사이트 캡처는 `img/project-img/`, AI로 생성한 별도 배경은 `img/project-backgrounds/`로 분리했습니다. 배경은 WebP와 모바일용 960px 버전을 함께 제공합니다. [배경 제작 프롬프트](img/project-backgrounds/README.md)에 제작 방식과 프롬프트를 기록했습니다. 로딩 애니메이션은 유지합니다.

## 로컬 실행

프로젝트 폴더에서 아래 명령을 실행한 뒤 `http://127.0.0.1:4174/`로 접속합니다.

```sh
python -m http.server 4174 --bind 127.0.0.1
```

개인 검수 메모와 현재 사용하지 않는 이미지 원본은 `.local/`에 보관하며 Git에 포함하지 않습니다.

## 연락처

- Email: [tnfh23@gmail.com](mailto:tnfh23@gmail.com)
- GitHub: [tnfh23-web](https://github.com/tnfh23-web)
- Blog: [개발 기록](https://velog.io/@ghggh23/posts)
