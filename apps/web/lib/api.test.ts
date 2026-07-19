import {
  adminCreateWork,
  getBooks,
  getCurrentUser,
  getTopTropes,
  getTropes,
  login,
} from "./api";

function mockFetchResponse(init: {
  ok: boolean;
  status: number;
  statusText?: string;
  json?: () => Promise<unknown>;
}) {
  return {
    ok: init.ok,
    status: init.status,
    statusText: init.statusText ?? "",
    json: init.json ?? (() => Promise.resolve(null)),
  } as Response;
}

describe("api request 헬퍼", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("성공 응답이면 JSON 본문 반환", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({ ok: true, status: 200, json: () => Promise.resolve([{ id: "t1" }]) }),
    );

    await expect(getTropes()).resolves.toEqual([{ id: "t1" }]);
  });

  it("204 응답이면 undefined 반환", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse({ ok: true, status: 204 }));

    await expect(adminCreateWork({ title: "x" })).resolves.toBeUndefined();
  });

  it("실패 응답이면 ApiError를 상태코드/메시지와 함께 던짐", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ message: "트로프 없음" }),
      }),
    );

    await expect(getTropes()).rejects.toMatchObject({ status: 404, message: "트로프 없음" });
  });

  it("message가 배열이면 콤마로 join", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: ["a", "b"] }),
      }),
    );

    await expect(getTropes()).rejects.toMatchObject({
      status: 400,
      message: "a, b",
    });
  });

  it("실패 응답 body가 JSON이 아니면 statusText로 대체", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("not json")),
      }),
    );

    await expect(getTropes()).rejects.toMatchObject({
      status: 500,
      message: "Internal Server Error",
    });
  });

  it("skip/take를 쿼리 파라미터로 전달", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({ ok: true, status: 200, json: () => Promise.resolve([]) }),
    );

    await getBooks({ skip: 10, take: 20 });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/works?skip=10&take=20");
  });

  it("topLevelOnly가 true면 쿼리에 반영", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({ ok: true, status: 200, json: () => Promise.resolve([]) }),
    );

    await getTropes(true);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/tropes?topLevelOnly=true");
  });

  it("period/take로 랭킹 조회 쿼리 구성", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({ ok: true, status: 200, json: () => Promise.resolve([]) }),
    );

    await getTopTropes("monthly", 5);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/ranking/tropes?period=monthly&take=5");
  });

  it("clientRequest는 credentials: include를 포함", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) }),
    );

    await login("a@test.com", "pw1234");

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init).toMatchObject({ credentials: "include", method: "POST" });
  });

  it("adminRequest는 Cookie 헤더를 전달하고 캐시하지 않음", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      mockFetchResponse({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: "u1", role: "ADMIN" }),
      }),
    );

    await getCurrentUser("session_id=abc");

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init).toMatchObject({ cache: "no-store", headers: { Cookie: "session_id=abc" } });
  });
});
