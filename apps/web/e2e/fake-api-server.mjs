// e2e 전용 가짜 API 서버. Next 서버(서버 컴포넌트 fetch)와 브라우저(클라이언트 fetch) 양쪽에서
// 호출되므로 CORS 응답 헤더까지 직접 채워준다 — 실제 NestJS API 대신 고정된 fixture만 반환한다.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4100);
const ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3100";

const trope1 = {
  id: "trope-1",
  name: "Chosen One",
  description: "평범해 보이던 주인공이 사실 세계를 구할 운명을 타고났다는 설정.",
  parentId: null,
  likeScore: 5,
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
};

const work1 = {
  id: "work-1",
  title: "The Fellowship of the Ring",
  description: "In ancient times the Rings of Power were crafted by the Elven-smiths...",
  firstPublishDate: "November 12, 1972",
  coverId: 14627060,
  likeScore: 2,
  authors: [{ workId: "work-1", authorId: "author-1", author: { id: "author-1", name: "J.R.R. Tolkien" } }],
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
};

function sendJson(res, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Credentials": "true",
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const { pathname } = url;
  const method = req.method ?? "GET";

  if (method === "GET" && pathname === "/tropes") {
    return sendJson(res, 200, [trope1]);
  }
  if (method === "GET" && pathname === "/tropes/trope-1") {
    return sendJson(res, 200, trope1);
  }
  if (method === "GET" && pathname === "/tropes/trope-1/children") {
    return sendJson(res, 200, []);
  }
  if (method === "GET" && pathname === "/tropes/trope-1/works") {
    return sendJson(res, 200, [work1]);
  }
  if (method === "GET" && /^\/tropes\/[^/]+$/.test(pathname)) {
    return sendJson(res, 404, { message: "Trope not found" });
  }

  if (method === "GET" && pathname === "/works") {
    return sendJson(res, 200, [work1]);
  }
  if (method === "GET" && pathname === "/works/work-1") {
    return sendJson(res, 200, work1);
  }
  if (method === "GET" && pathname === "/works/work-1/tropes") {
    return sendJson(res, 200, [trope1]);
  }
  if (method === "GET" && /^\/works\/[^/]+$/.test(pathname)) {
    return sendJson(res, 404, { message: "Work not found" });
  }

  if (method === "GET" && pathname === "/ranking/tropes") {
    return sendJson(res, 200, [{ trope: trope1, score: 10 }]);
  }

  if (method === "POST" && pathname === "/auth/login") {
    const body = await readJsonBody(req);
    if (body.password === "wrongpass") {
      return sendJson(res, 401, { message: "Invalid email or password" });
    }
    return sendJson(res, 200, { success: true });
  }
  if (method === "DELETE" && pathname === "/auth/logout") {
    return sendJson(res, 200, { success: true });
  }

  if (method === "POST" && pathname === "/user") {
    const body = await readJsonBody(req);
    if (body.email === "dup@test.com") {
      return sendJson(res, 409, { message: "A user with this email already exists" });
    }
    return sendJson(res, 200, {
      id: "user-1",
      email: body.email,
      nickname: body.nickname,
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    });
  }

  if (method === "POST" && pathname === "/tropes") {
    const body = await readJsonBody(req);
    return sendJson(res, 200, { ...trope1, name: body.name, description: body.description ?? null });
  }
  if (method === "POST" && pathname === "/tropes/trope-1/like") {
    return sendJson(res, 200, { liked: true, likeScore: trope1.likeScore + 1 });
  }
  if (method === "POST" && pathname === "/tropes/trope-1/works/work-1/vote") {
    const body = await readJsonBody(req);
    return sendJson(res, 200, { voteScore: body.voteType === "UP" ? 1 : -1 });
  }
  if (method === "POST" && pathname === "/tropes/trope-1/works") {
    const body = await readJsonBody(req);
    return sendJson(res, 200, { workId: body.workId, tropeId: "trope-1", source: "USER", voteScore: 0 });
  }
  if (method === "POST" && pathname === "/works/work-1/tropes") {
    const body = await readJsonBody(req);
    return sendJson(res, 200, { workId: "work-1", tropeId: body.tropeId, source: "USER", voteScore: 0 });
  }

  return sendJson(res, 404, { message: `No fixture route for ${method} ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`fake-api-server listening on http://localhost:${PORT}`);
});
