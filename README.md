# Smart Factory Stock Control System Simulation  
**(Beagle + OMX-F 기반 스마트 재고 제어 시뮬레이션)**

> Smart Factory Stock Control System Simulation utilizing Beagle and OMX-F Robots

## 1) 프로젝트 개요

본 프로젝트는 **금속가공/소형 기계부품을 다품종 소량생산하는 50인 미만 중소기업**을 대상으로,  
기존 CCTV 인프라는 있으나 AI 기반 분석이 없는 환경에서 **재고 부족 감지 및 자동 보충 물류**를 구현하는 시뮬레이션입니다.

- **핵심 페인 포인트:** QC 검사 + 포장 경계 지점
- **핵심 목표:** 생산라인 재고를 실시간 감지하고, 부족 시 로봇 연계를 통해 자동 보충

---

## 2) 시스템 동작 프레임워크

1. 공장의 각 생산라인에서 부품 재고를 감지한다.  
2. 부족한 부품이 발생하면 시스템이 이를 인지한다.  
3. 재고 보관소의 OMX-F 로봇에 신호를 보내고, 대시보드에 현황이 기록된다.  
4. OMX-F 로봇이 부품을 비글(Beagle)에 적재하고, 비글이 생산라인으로 운반한다.  
5. 생산라인의 OMX-F 로봇이 비글의 부품을 하역해 라인 투입 위치로 이동시킨다.

---

## 3) 로봇/장비 구성 요약

### 3.1 비글 로봇 (Beagle AI Robot)
- 참고 링크: https://robomation-shop.co.kr/category/%EB%B9%84%EA%B8%80ai%EB%A1%9C%EB%B4%87/140/
- 역할:
  - 생산라인과 보관소 사이의 **이동형 운반 플랫폼(AMR 성격)**
  - 부품 적재 후 지정 라인까지 자율/반자율 운송

### 3.2 OMX-F 로봇
- 참고 링크: https://docs.robotis.com/docs/systems/omx/introduction/
- 역할:
  - 보관소/생산라인에서의 **픽앤플레이스(적재·하역) 작업**
  - 비글과 연동하여 물류 이송의 시작/종료 공정을 담당

---

## 4) 시스템 구성 요소

| 구성 요소 | 유형 | 주요 기능 | 입/출력 |
|---|---|---|---|
| 생산라인 재고 감지 모듈 | 센싱/비전 | 라인별 부품 수량 감지 | 입력: CCTV/센서 데이터, 출력: 재고 상태 |
| 재고 부족 인지 로직 | 분석 엔진 | 임계치 기반 부족 판단 | 입력: 재고 상태, 출력: 보충 요청 이벤트 |
| 대시보드 | 모니터링 UI | 상태 기록/시각화/알림 | 입력: 이벤트 로그, 출력: 운영 현황 |
| 보관소 OMX-F | 매니퓰레이터 | 보충 부품 픽업 후 비글 적재 | 입력: 보충 요청, 출력: 적재 완료 |
| 비글 로봇 | 모바일 로봇 | 보관소→생산라인 운반 | 입력: 경로/목적지, 출력: 도착 상태 |
| 라인 OMX-F | 매니퓰레이터 | 비글 하역 후 라인 공급 | 입력: 도착 신호, 출력: 라인 투입 완료 |

---

## 5) 팀원 정보 (더미 데이터, 전치 테이블)

| 구분 | 팀원1 | 팀원2 | 팀원3 | 팀원4 |
|---|---|---|---|---|
| GitHub ID | `alpha-dev` | `vision-bot` | `robot-flow` | `dash-maker` |
| 프로필 | https://github.com/alpha-dev | https://github.com/vision-bot | https://github.com/robot-flow | https://github.com/dash-maker |
| 이름 | 김도연 | 김재광 | 정지우 | 홍지수 |
| 역할 | PM / 시스템 아키텍트 | AI 비전 & 재고 감지 | 로봇 연동(OMX-F/Beagle) | 대시보드 & 데이터 로깅 |

---

## 6) 참고 링크

- Beagle AI Robot: https://robomation-shop.co.kr/category/%EB%B9%84%EA%B8%80ai%EB%A1%9C%EB%B4%87/140/
- OMX-F Introduction (ROBOTIS Docs): https://docs.robotis.com/docs/systems/omx/introduction/
