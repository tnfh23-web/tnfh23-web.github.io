# Yoon Suro · Web Publisher Portfolio

웹 퍼블리셔 **윤수로**의 개인 포트폴리오입니다.

**[포트폴리오 보기](https://tnfh23-web.github.io/)**

## 페이지 구성

| 섹션 | 내용 |
| --- | --- |
| HOME | 자기소개, 글자 호버·드래그, 슬로모션 버튼 |
| ABOUT | 프로필, 경력, 교육, 기술, 프로젝트 경험 |
| WORKS | Kumu, EATGO, MODOO, 스타스케이프, 건일제약, 해양수산부, 문화체육관광부 |
| VIBE | REFLOW, AFTERIMAGE, UPDATES |
| CONTACT | 연락처, GitHub·Blog 링크, 마퀴 |

## 사용 기술

- HTML · CSS · JavaScript
- GSAP · ScrollTrigger · SplitText · Lenis
- Satoshi · Pretendard
- GitHub Pages

공통 최대 너비는 `180rem`, 밝은 배경은 `#f2f2f2`입니다. 공통 색상과 그리드 변수는 `assets/css/tokens.css`에서 관리합니다.

## 주요 기능

- 타일 그리드 로딩 후 히어로 타이틀과 헤더 등장. Enter·클릭으로 스킵할 때도 열림 전환을 유지합니다.
- WORKS는 캡슐 오프닝과 카드 스택, VIBE는 SVG 블라인드 전환을 사용합니다. 카드 도착 후 콘텐츠가 자동으로 등장합니다.
- 모바일 세로 화면에서도 VIBE 전환을 유지합니다. 화면에 맞지 않는 가로 화면과 모션 줄이기 환경에서는 읽기 쉬운 목록으로 표시합니다.
- PC·모바일 헤더는 아래 스크롤에서 숨고 위 스크롤에서 나타납니다. 메뉴가 열려 있거나 키보드 포커스가 있으면 유지합니다.
- CONTACT는 VIBE 위로 올라오며, 마퀴가 마지막 순서로 등장해 반복됩니다.

## 로컬 실행

프로젝트 폴더에서 실행합니다. 해당 포트에 서버가 이미 실행 중이면 그대로 사용합니다.

```sh
python -m http.server 4175 --bind 127.0.0.1
```

접속 주소: `http://127.0.0.1:4175/`

`.local/`의 개인 검수 자료는 Git에 포함하지 않습니다.
