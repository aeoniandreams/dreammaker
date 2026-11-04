// Firebase 설정값을 아래 null 자리에 붙여 넣으면 "내 작업"을 구글 로그인으로 클라우드에 저장할 수 있어요.
// (Firebase 콘솔 → 프로젝트 설정 → 내 앱 → 웹 앱의 firebaseConfig 객체)
// 이 값은 공개돼도 되는 종류예요. 내 작업을 지키는 건 로그인과 Firestore 보안 규칙이에요.
// null로 두면 지금처럼 이 브라우저에만 저장해요.
//
// 예)
// window.FIREBASE_CONFIG = {
//   apiKey: "...",
//   authDomain: "내프로젝트.firebaseapp.com",
//   projectId: "내프로젝트",
//   appId: "..."
// };
window.FIREBASE_CONFIG = null;
