# Lazy Loading 최적화 가이드

## ✅ 안전한 최적화 방법

이 프로젝트의 lazy loading 최적화는 **기존 코드를 망가뜨리지 않도록** 설계되었습니다.

## 🔒 보안 및 구조 보장

### 현재 구조 (변경하지 마세요!)

```
ProtectedRoute > Suspense > LazyComponent
```

이 순서가 중요한 이유:
1. **ProtectedRoute가 먼저 체크**: 인증되지 않은 사용자는 컴포넌트 로드 전에 리다이렉트
2. **Suspense가 로딩 상태 관리**: 컴포넌트 로드 중 깜빡임 방지
3. **LazyComponent는 마지막**: 실제 렌더링은 ProtectedRoute가 허용한 경우에만

### Preloading이 안전한 이유

```typescript
// 마우스 호버 시 미리 로드
onMouseEnter: () => preloadRoutes.boards()
```

- ✅ **Preload는 단순히 번들을 다운로드만 함**
- ✅ **실제 렌더링은 ProtectedRoute가 제어**
- ✅ **인증되지 않은 사용자가 preload해도 렌더링되지 않음**

## 📊 최적화 효과

### Before (최적화 전)
1. 사용자가 네비게이션 클릭
2. 번들 다운로드 시작 (느림)
3. ProtectedRoute 체크
4. 컴포넌트 렌더링

### After (최적화 후)
1. 사용자가 네비게이션에 마우스 호버
2. 번들 미리 다운로드 시작 (백그라운드)
3. 사용자가 클릭
4. 번들이 이미 로드되어 있음 → 즉시 ProtectedRoute 체크
5. 컴포넌트 즉시 렌더링

**결과**: 클릭 후 로딩 시간이 거의 0에 가까워짐

## ⚠️ 주의사항

### 절대 하지 말아야 할 것

1. **ProtectedRoute와 Suspense 순서 변경 금지**
   ```tsx
   // ❌ 잘못된 예
   <Suspense>
     <ProtectedRoute>
       <Component />
     </ProtectedRoute>
   </Suspense>
   
   // ✅ 올바른 예 (현재 구조)
   <ProtectedRoute>
     <Suspense>
       <Component />
     </Suspense>
   </ProtectedRoute>
   ```

2. **Preload를 클릭 핸들러에 넣지 말 것**
   ```tsx
   // ❌ 잘못된 예
   onClick: () => {
     preloadRoutes.boards();
     navigate("/boards");
   }
   
   // ✅ 올바른 예 (현재 구조)
   onMouseEnter: () => preloadRoutes.boards(),
   onClick: () => navigate("/boards"),
   ```

3. **초기 번들에 모든 페이지 포함하지 말 것**
   - 메인 페이지만 eager loading 고려
   - 나머지는 lazy loading 유지

## 🛠️ 추가 최적화 가능한 부분

### 1. 초기 번들 최적화 (선택사항)

메인 페이지만 eager loading:
```tsx
// 메인 페이지만 즉시 로드
import HOM_01 from "@/pages/HOM_01"; // lazy 제거

// 나머지는 lazy 유지
const BRD_04 = lazy(() => import("@/pages/BRD_04"));
```

### 2. Route-based Code Splitting (현재 사용 중)

각 페이지가 별도 번들로 분리되어 있어 이미 최적화됨.

### 3. Bundle 분석

```bash
npm run build
npx vite-bundle-visualizer
```

큰 번들을 확인하고 필요시 추가 분할.

## 📝 코드 위치

- **라우트 정의**: `src/main.tsx`
- **Preload 함수**: `src/main.tsx` (preloadRoutes)
- **네비게이션 연결**: `src/App.tsx` (navItems)
- **Header 컴포넌트**: `src/features/layout/Header/HeaderApp.tsx`

## ✅ 테스트 체크리스트

최적화 후 다음을 확인하세요:

- [ ] 비로그인 사용자가 보호된 페이지에 접근 시 리다이렉트 정상 작동
- [ ] 네비게이션 호버 시 페이지 로드가 빨라짐
- [ ] ProtectedRoute 체크가 여전히 작동함
- [ ] Suspense fallback이 정상 표시됨
- [ ] 모든 페이지가 정상적으로 로드됨

## 🎯 결론

현재 구현된 최적화는:
- ✅ **기존 코드 구조 유지**
- ✅ **보안 기능 보장** (ProtectedRoute)
- ✅ **UX 개선** (빠른 페이지 전환)
- ✅ **타입 안전성 유지**

**안심하고 사용하세요!** 🚀

