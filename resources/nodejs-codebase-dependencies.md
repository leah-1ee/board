---
authors: [daeyeon]
---
# 소스 트리 의존성

Node.js 소스 트리의 `deps/`에는 runtime, build, test에 사용하는 외부 프로젝트와 별도로 관리하는 구성
요소가 포함되어 있습니다. 이 문서는 각 dependency를 용도별로 분류하고 upstream, 관련 API/기능,
Node.js 내부에서 담당하는 범위를 정리했습니다.

## Runtime과 platform

| 모듈 | 관련 API/기능 | 설명 |
| --- | --- | --- |
| [V8](https://chromium.googlesource.com/v8/v8.git/) | JavaScript runtime, WebAssembly, `node:v8`, `node:vm` | JavaScript와 WebAssembly를 실행하는 engine. 객체 모델, garbage collector, JIT compiler 등 Node.js runtime의 기반을 구성 |
| [temporal_rs](https://github.com/boa-dev/temporal), [ICU4X](https://github.com/unicode-org/icu4x) | `Temporal` | V8의 Temporal 날짜와 시간 연산에 쓰는 Rust library. `temporal_rs`가 ECMAScript Temporal을 구현하고 ICU4X가 달력, locale, timezone 처리를 지원 |
| [ICU](https://github.com/unicode-org/icu) | `Intl`, `TextDecoder`, `node:buffer` | Unicode와 국제화 처리를 위한 library. locale별 날짜와 숫자 형식, timezone, 문자 인코딩 data를 담당 |
| [libuv](https://github.com/libuv/libuv) | event loop, `node:fs`, `node:net`, `node:dns`, `node:child_process` | 운영체제마다 다른 event notification, file system, network, process API를 하나의 비동기 I/O 인터페이스로 제공 |
| [Chromium inspector protocol](https://chromium.googlesource.com/deps/inspector_protocol/) | `node:inspector` | Chrome DevTools Protocol의 명령과 event를 정의한 schema, Node.js inspector의 C++ binding을 만드는 generator 포함 |
| [libffi](https://github.com/libffi/libffi) | `node:ffi` | 실행 중에 정해진 native function signature를 플랫폼 ABI에 맞춰 호출하는 library. C callback을 JavaScript 함수로 연결할 때도 사용 |

## Network와 crypto

| 모듈 | 관련 API/기능 | 설명 |
| --- | --- | --- |
| [ada](https://github.com/ada-url/ada) | `URL`, `URLPattern`, `node:url`, ES module resolver | WHATWG URL 표준을 구현한 C++ parser. URL 정규화와 국제화 domain name, IDN 변환에 사용 |
| [c-ares](https://github.com/c-ares/c-ares) | `node:dns` | event loop를 막지 않고 DNS record를 조회하는 C library. 운영체제의 resolver를 쓰는 name lookup 경로와는 별도 |
| [llhttp](https://github.com/nodejs/llhttp) | `node:http`, `node:https` | HTTP/1 message를 request line, header, body로 구분하는 C parser. TypeScript로 정의한 state machine에서 parser code를 생성 |
| [Undici](https://github.com/nodejs/undici) | `fetch`, `WebSocket`, `EventSource`, `node:http`의 WebSocket API | Node.js가 관리하는 HTTP client. Web platform의 `fetch`, WebSocket, EventSource를 구현하며 `node:http` request와는 별도 |
| [nghttp2](https://github.com/nghttp2/nghttp2) | `node:http2` | HTTP/2의 binary frame, stream, connection state를 처리하는 protocol library |
| [ngtcp2](https://github.com/ngtcp2/ngtcp2), [nghttp3](https://github.com/ngtcp2/nghttp3) | `node:quic` | ngtcp2는 UDP 기반 QUIC transport를, nghttp3는 그 위의 HTTP/3 frame과 stream을 구현 |
| [OpenSSL](https://github.com/openssl/openssl) | `node:crypto`, `node:tls`, `node:https`, `node:http2`, `node:quic` | 암호화 algorithm, 인증서, TLS를 제공하는 toolkit. Node.js의 보안 통신과 QUIC 암호화 기반 |
| [ncrypto](https://github.com/nodejs/ncrypto) | `node:crypto`, `node:tls`, `node:http2`, `node:quic` | Node.js native code에서 OpenSSL을 일관되게 사용하도록 감싼 C++ library. crypto, TLS, HTTP/2, QUIC subsystem이 공유 |
| [uvwasi](https://github.com/nodejs/uvwasi) | `node:wasi` | WebAssembly가 file system, clock 같은 host 기능을 호출하는 표준인 WASI를 libuv 위에 구현 |

## Storage, compression과 executable

| 모듈 | 관련 API/기능 | 설명 |
| --- | --- | --- |
| [Brotli](https://github.com/google/brotli) | `node:zlib` | Deflate보다 높은 압축률을 목표로 만든 범용 무손실 압축 형식. `node:zlib`에서 Brotli stream encoder와 decoder를 제공 |
| [Chromium zlib fork](https://chromium.googlesource.com/chromium/src/third_party/zlib) | `node:zlib` | Deflate와 gzip 형식을 처리하는 무손실 압축 library. Node.js는 성능 개선이 포함된 Chromium fork를 사용 |
| [Zstandard](https://github.com/facebook/zstd) | `node:zlib` | 실시간 처리에서 속도와 압축률의 균형을 목표로 만든 무손실 압축 형식. `node:zlib`에서 RFC 8878 형식의 encoder와 decoder를 제공 |
| [HdrHistogram_c](https://github.com/HdrHistogram/HdrHistogram_c) | `node:perf_hooks` | 넓은 값 범위에서 지연 시간 분포와 percentile을 낮은 비용으로 기록하는 histogram. event loop 지연과 실행 시간 분포 측정에 사용 |
| [Perfetto](https://github.com/google/perfetto) | `node:trace_events` | 프로그램의 실행 event를 시간순으로 기록하고 분석하는 tracing framework. Node.js와 V8의 performance trace를 수집하는 backend |
| [LIEF](https://github.com/lief-project/LIEF) | SEA | ELF, Mach-O, PE 실행 파일을 읽고 수정하는 cross-platform library. SEA 빌드에서 JavaScript bundle을 Node.js 실행 파일에 삽입할 때 사용 |
| [postject](https://github.com/nodejs/postject) | SEA | 실행 파일에 삽입한 resource를 찾고 읽는 library. SEA로 만든 실행 파일인지 판별하고 내장된 JavaScript bundle을 불러오는 데 사용 |
| [simdjson](https://github.com/simdjson/simdjson) | SEA, Node.js configuration, module loader, test runner | CPU의 SIMD 명령을 활용하는 고속 C++ JSON parser. SEA 설정, task 설정, `package.json`, inspector 응답처럼 native code가 읽는 JSON을 처리 |
| [SQLite](https://sqlite.org/src/dir?ci=trunk) | `node:sqlite`, `localStorage`, `sessionStorage` | 별도 server 없이 파일이나 memory에서 동작하는 embedded SQL database. `node:sqlite`와 Web Storage의 저장 engine |
| [nbytes](https://github.com/nodejs/nbytes) | `Buffer`, `node:dns`, `node:http2`, `node:quic` | Node.js core에서 분리한 byte 처리 library. endian 변환, 문자열 encoding, byte 검색 동작을 여러 native subsystem에서 공유 |

## JavaScript tooling과 배포물

| 모듈 | 관련 API/기능 | 설명 |
| --- | --- | --- |
| [Acorn](https://github.com/acornjs/acorn), [acorn-walk](https://github.com/acornjs/acorn/tree/master/acorn-walk) | `node:repl`, ES module loader, error source 표시 | JavaScript source를 AST로 변환하는 parser와 AST 순회 도구. REPL 입력 변환, module 분석, syntax error 위치 표시에 사용 |
| [merve](https://github.com/nodejs/merve) | ES module loader | CommonJS source를 실행하지 않고 export 이름과 re-export를 찾는 C++ parser. ES module에서 CommonJS의 named export를 가져올 수 있게 지원 |
| [Amaro](https://github.com/nodejs/amaro) | TypeScript 실행, `node:module` | SWC의 TypeScript parser를 WebAssembly로 감싼 library. type annotation을 제거하고 일부 TypeScript 전용 syntax를 JavaScript로 변환 |
| [minimatch](https://github.com/isaacs/minimatch) | `node:fs`, file watcher | file path가 `*.js`, `src/**` 같은 glob pattern과 일치하는지 판별. 파일 탐색과 watcher 제외 규칙에 사용 |
| [Corepack](https://github.com/nodejs/corepack) | package manager 선택 | `package.json`에 지정한 Yarn, pnpm version을 찾아 실행하는 package manager proxy. 기본 배포에서는 제외됐지만 선택적으로 함께 빌드할 수 있음 |
| [npm CLI](https://github.com/npm/cli) | `npm`, `npx` CLI | package 설치, dependency와 script 관리, registry 배포를 담당하는 package manager. Node.js 배포물에 CLI로 포함 |

## Build와 test

| 모듈 | 관련 API/기능 | 설명 |
| --- | --- | --- |
| [GoogleTest](https://github.com/google/googletest) | C++ test binary | Node.js와 V8의 C++ unit test를 작성하고 mock object를 구성하는 test framework |

## Dependency 갱신

갱신 절차는 [Maintaining Dependencies](https://github.com/nodejs/node/blob/main/doc/contributing/maintaining/maintaining-dependencies.md),
자동화는 [`tools/dep_updaters/`](https://github.com/nodejs/node/tree/main/tools/dep_updaters)를 참고합니다.
