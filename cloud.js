// "내 작업"의 클라우드 저장소(Firebase 로그인 + Firestore).
// firebase-config.js에 설정값이 있을 때만 동작하고, 없거나 불러오지 못하면 사이트는 브라우저 저장만 쓴다.
// 작업마다 users/{내 uid}/works/{id} 문서 하나로 저장한다. 작업 내용은 Firestore가 지원하지 않는
// 중첩 배열을 피하려고 JSON 문자열(json 필드)로 넣는다.
const FIREBASE_VERSION = '10.14.1';
const FIREBASE_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;

const cloud = { configured: false, ready: false, user: null, error: null };
window.cloudWorks = cloud;

function notify() {
    window.dispatchEvent(new CustomEvent('cloudauth'));
}

async function initCloud() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey) return;

    const [appM, authM, fsM] = await Promise.all([
        import(FIREBASE_BASE + 'firebase-app.js'),
        import(FIREBASE_BASE + 'firebase-auth.js'),
        import(FIREBASE_BASE + 'firebase-firestore.js')
    ]);
    const app = appM.initializeApp(cfg);
    const auth = authM.getAuth(app);
    const db = fsM.getFirestore(app);
    const worksRef = () => fsM.collection(db, 'users', auth.currentUser.uid, 'works');

    cloud.configured = true;
    cloud.signIn = () => authM.signInWithPopup(auth, new authM.GoogleAuthProvider());
    cloud.signOut = () => authM.signOut(auth);
    cloud.list = async () => {
        const snap = await fsM.getDocs(worksRef());
        return snap.docs.map(d => {
            const x = d.data();
            return { id: d.id, name: x.name, savedAt: x.savedAt, data: JSON.parse(x.json) };
        });
    };
    cloud.put = work => fsM.setDoc(fsM.doc(worksRef(), work.id), {
        name: work.name,
        savedAt: work.savedAt,
        json: JSON.stringify(work.data)
    });
    cloud.remove = id => fsM.deleteDoc(fsM.doc(worksRef(), id));

    authM.onAuthStateChanged(auth, u => {
        cloud.user = u ? { uid: u.uid, email: u.email, name: u.displayName } : null;
        cloud.ready = true;
        notify();
    });
}

initCloud().catch(err => {
    cloud.error = err;
    cloud.ready = true;
    notify();
});
