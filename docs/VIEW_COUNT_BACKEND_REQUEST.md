# 조회수 중복 증가 문제 해결 요청

## 📋 현재 문제 상황

```
❌ 문제: 조회수가 의도하지 않게 계속 증가함

1. 게시글 상세 페이지 진입: 조회수 +1 ✅ (정상)
2. 댓글 작성: 조회수 +2 ❌
3. 댓글 수정: 조회수 +2 ❌
4. 댓글 삭제: 조회수 +2 ❌
5. 좋아요 클릭: 조회수 +1 ❌
6. 페이지 새로고침: 조회수 +1 ❌
```

**원인:**
- 프론트에서 `GET /api/community/posts/{id}`를 호출할 때마다 조회수가 증가
- 댓글/좋아요 등의 액션 후 최신 데이터를 받기 위해 GET 재요청
- 현재 백엔드가 GET 요청마다 조회수를 자동으로 증가시키는 구조

---

## 💡 해결 방안 (3가지 옵션)

### **Option 1: 조회수 API 분리 (추천 ⭐)**

**변경 사항:**
```java
// 기존: GET 요청 시 자동 조회수 증가 ❌
@GetMapping("/posts/{postId}")
public Post getPost(@PathVariable Long postId) {
    post.incrementHit();  // 여기서 증가
    return post;
}

// 변경: 조회수 증가 API 분리 ✅
@GetMapping("/posts/{postId}")
public Post getPost(@PathVariable Long postId) {
    // 조회수 증가 안 함
    return post;
}

@PostMapping("/posts/{postId}/view")
public void incrementViewCount(
    @PathVariable Long postId,
    HttpServletRequest request
) {
    String clientIp = getClientIp(request);
    viewCountService.incrementIfNotViewed(postId, clientIp);
}
```

**장점:**
- GET은 순수하게 데이터만 조회 (RESTful 원칙 준수)
- 조회수 증가는 명시적으로 POST 호출
- 프론트에서 페이지 진입 시 한 번만 호출

**단점:**
- 프론트엔드 코드 수정 필요
- API 엔드포인트 추가 필요

---

### **Option 2: IP 기반 중복 방지 (현재 구조 유지) ⭐⭐**

**변경 사항:**
```java
@GetMapping("/posts/{postId}")
public Post getPost(
    @PathVariable Long postId,
    HttpServletRequest request
) {
    Post post = postRepository.findById(postId);

    // IP 기반 중복 체크
    String clientIp = getClientIp(request);
    boolean canIncrement = viewCountService
        .canIncrementView(postId, clientIp);

    if (canIncrement) {
        post.incrementHit();
        // Redis에 24시간 TTL로 기록
        viewCountService.recordView(postId, clientIp);
    }

    return post;
}
```

**Redis 구조:**
```
Key: "post_view:{postId}:{ip}"
Value: "1"
TTL: 24시간
```

**장점:**
- 프론트 코드 수정 불필요
- 같은 IP에서 24시간 내 중복 조회 방지
- 실제 unique 사용자 수에 가까운 조회수

**단점:**
- Redis 의존성 필요
- IP 추출 로직 필요 (프록시 환경 고려)

---

### **Option 3: 쿠키 기반 중복 방지 (간단)**

```java
@GetMapping("/posts/{postId}")
public Post getPost(
    @PathVariable Long postId,
    @CookieValue(value = "viewed_posts", required = false) String viewedPosts,
    HttpServletResponse response
) {
    Post post = postRepository.findById(postId);

    Set<Long> viewed = parseViewedPosts(viewedPosts);

    if (!viewed.contains(postId)) {
        post.incrementHit();
        viewed.add(postId);

        // 쿠키 업데이트 (24시간 유효)
        Cookie cookie = new Cookie("viewed_posts",
            String.join(",", viewed.stream()
                .map(String::valueOf)
                .collect(Collectors.toList())));
        cookie.setMaxAge(24 * 60 * 60);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
    }

    return post;
}
```

**장점:**
- 구현 간단
- Redis/DB 불필요

**단점:**
- 사용자가 쿠키 삭제하면 무효화
- 쿠키 크기 제한 (많은 게시글 조회 시 문제)
- 시크릿 모드에서 우회 가능

---

## 📊 옵션 비교

| 항목 | Option 1 (분리) | Option 2 (IP) | Option 3 (쿠키) |
|------|----------------|---------------|----------------|
| 구현 난이도 | 중 | 중 | 하 |
| 정확도 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 성능 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 우회 가능성 | 낮음 | 낮음 | 중간 (쿠키 삭제) |
| 프론트 수정 | 필요 | 불필요 | 불필요 |
| 인프라 요구사항 | 없음 | Redis 필요 | 없음 |

**권장: Option 2 (IP 기반)** - 프론트 수정 없이 가장 정확함

---

## 🛠️ 구현 가이드 (Option 2 - Redis 사용)

### 1. Redis 의존성 추가

**build.gradle**
```gradle
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

**application.yml**
```yaml
spring:
  redis:
    host: localhost
    port: 6379
```

---

### 2. ViewCountService 구현

```java
package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class ViewCountService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final Duration VIEW_TTL = Duration.ofHours(24);

    /**
     * 조회수 증가 가능 여부 확인
     * @param postId 게시글 ID
     * @param ip 클라이언트 IP
     * @return true: 증가 가능, false: 이미 조회함
     */
    public boolean canIncrementView(Long postId, String ip) {
        String key = "post_view:" + postId + ":" + ip;
        return !Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 조회 기록 저장
     * @param postId 게시글 ID
     * @param ip 클라이언트 IP
     */
    public void recordView(Long postId, String ip) {
        String key = "post_view:" + postId + ":" + ip;
        redisTemplate.opsForValue().set(key, "1", VIEW_TTL);
    }
}
```

---

### 3. IP 추출 유틸 클래스

```java
package com.example.util;

import javax.servlet.http.HttpServletRequest;

public class IpUtils {

    /**
     * 클라이언트 실제 IP 추출 (프록시 환경 고려)
     */
    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // 첫 번째 IP만 추출 (프록시 거치면 여러 IP가 올 수 있음)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }
}
```

---

### 4. Controller 수정

```java
package com.example.controller;

import com.example.service.PostService;
import com.example.service.ViewCountService;
import com.example.util.IpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/community/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private ViewCountService viewCountService;

    /**
     * 게시글 상세 조회 (조회수 IP 기반 중복 방지)
     */
    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPost(
        @PathVariable Long postId,
        HttpServletRequest request
    ) {
        Post post = postService.getPost(postId);

        // IP 기반 조회수 증가 로직
        String clientIp = IpUtils.getClientIp(request);
        if (viewCountService.canIncrementView(postId, clientIp)) {
            postService.incrementHit(postId);
            viewCountService.recordView(postId, clientIp);
        }

        return ResponseEntity.ok(post);
    }
}
```

---

### 5. PostService 수정

```java
package com.example.service;

import com.example.entity.Post;
import com.example.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    /**
     * 조회수 증가
     */
    @Transactional
    public void incrementHit(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        post.incrementHit();
    }
}
```

---

## ✅ 테스트 케이스

```java
package com.example.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ViewCountServiceTest {

    @Autowired
    private ViewCountService viewCountService;

    @Autowired
    private PostService postService;

    @Test
    void 같은IP에서_24시간내_중복조회시_조회수증가안함() {
        // given
        Long postId = 1L;
        String ip = "192.168.1.1";
        int initialHit = postService.getPost(postId).getHit();

        // when
        if (viewCountService.canIncrementView(postId, ip)) {
            postService.incrementHit(postId);
            viewCountService.recordView(postId, ip);
        }

        // 중복 조회
        if (viewCountService.canIncrementView(postId, ip)) {
            postService.incrementHit(postId);
            viewCountService.recordView(postId, ip);
        }

        // then
        int finalHit = postService.getPost(postId).getHit();
        assertThat(finalHit - initialHit).isEqualTo(1); // 1번만 증가
    }

    @Test
    void 다른IP에서_조회시_조회수증가() {
        // given
        Long postId = 1L;
        int initialHit = postService.getPost(postId).getHit();

        // when
        String ip1 = "192.168.1.1";
        String ip2 = "192.168.1.2";

        if (viewCountService.canIncrementView(postId, ip1)) {
            postService.incrementHit(postId);
            viewCountService.recordView(postId, ip1);
        }

        if (viewCountService.canIncrementView(postId, ip2)) {
            postService.incrementHit(postId);
            viewCountService.recordView(postId, ip2);
        }

        // then
        int finalHit = postService.getPost(postId).getHit();
        assertThat(finalHit - initialHit).isEqualTo(2); // 2번 증가
    }

    @Test
    void 동일게시글_여러번요청_조회수1만증가() {
        // given
        Long postId = 1L;
        String ip = "192.168.1.1";
        int initialHit = postService.getPost(postId).getHit();

        // when - GET 요청 5번 시뮬레이션
        for (int i = 0; i < 5; i++) {
            if (viewCountService.canIncrementView(postId, ip)) {
                postService.incrementHit(postId);
                viewCountService.recordView(postId, ip);
            }
        }

        // then
        int finalHit = postService.getPost(postId).getHit();
        assertThat(finalHit - initialHit).isEqualTo(1); // 5번 요청해도 1번만 증가
    }
}
```

---

## 📝 요청사항 요약

**문제:** 조회수가 GET 요청마다 증가해서 부정확합니다.

**해결 방법:**
- ✅ **추천: IP 기반 중복 방지 (Redis 사용, 24시간 TTL)**
- 또는: 조회수 API를 별도 POST 엔드포인트로 분리

**기대 효과:**
- 같은 사용자가 24시간 내 여러 번 조회해도 1회만 카운트
- 댓글 작성/수정/삭제 시 조회수 증가 안 함
- 페이지 새로고침 시 조회수 증가 안 함
- 좋아요 클릭 시 조회수 증가 안 함

**기술 스택:**
- Spring Boot
- Redis (조회 기록 관리)
- IP 기반 중복 방지 로직

---

## 🔍 추가 고려사항

### 1. 성능 최적화
- Redis 대신 DB 사용 시: 정기적으로 오래된 기록 삭제 필요
- 대용량 트래픽 고려: Redis 권장

### 2. 프록시 환경
- `X-Forwarded-For` 헤더 확인 필수
- Nginx, CloudFlare 등 프록시 사용 시 실제 IP 추출

### 3. 보안
- IP 스푸핑 방지
- Redis 인증 설정 권장

### 4. 모니터링
- Redis 메모리 사용량 모니터링
- 조회수 급증 시 알림 설정

---

## 📞 문의사항

구현 중 궁금한 점이나 도움이 필요하시면 프론트엔드 팀에 문의 부탁드립니다.

**작성일:** 2025-11-06
**작성자:** Frontend Team
