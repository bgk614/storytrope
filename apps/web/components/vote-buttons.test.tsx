import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/lib/auth-context";
import { voteWorkTrope } from "@/lib/api";
import { VoteButtons } from "./vote-buttons";

jest.mock("@/lib/api", () => ({
  voteWorkTrope: jest.fn(),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

function renderWithAuth(user: { email: string; nickname: string } | null) {
  (useAuth as jest.Mock).mockReturnValue({ user, ready: true, setUser: jest.fn() });
  return render(<VoteButtons tropeId="trope-1" bookId="book-1" />);
}

describe("VoteButtons", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("로그인 안 했으면 클릭 시 에러 메시지, API 호출 안 함", async () => {
    renderWithAuth(null);

    await userEvent.click(screen.getByRole("button", { name: "▲" }));

    expect(await screen.findByText("Log in to vote.")).toBeInTheDocument();
    expect(voteWorkTrope).not.toHaveBeenCalled();
  });

  it("업보트 클릭 시 voteWorkTrope 호출, 결과로 점수 갱신", async () => {
    (voteWorkTrope as jest.Mock).mockResolvedValue({ voteScore: 7 });
    renderWithAuth({ email: "a@test.com", nickname: "tester" });

    await userEvent.click(screen.getByRole("button", { name: "▲" }));

    await waitFor(() => expect(screen.getByText("7")).toBeInTheDocument());
    expect(voteWorkTrope).toHaveBeenCalledWith("trope-1", "book-1", "UP");
  });

  it("다운보트 클릭 시 DOWN으로 voteWorkTrope 호출", async () => {
    (voteWorkTrope as jest.Mock).mockResolvedValue({ voteScore: -1 });
    renderWithAuth({ email: "a@test.com", nickname: "tester" });

    await userEvent.click(screen.getByRole("button", { name: "▼" }));

    await waitFor(() => expect(voteWorkTrope).toHaveBeenCalledWith("trope-1", "book-1", "DOWN"));
  });

  it("API 실패하면 에러 메시지 표시", async () => {
    (voteWorkTrope as jest.Mock).mockRejectedValue(new Error("서버 에러"));
    renderWithAuth({ email: "a@test.com", nickname: "tester" });

    await userEvent.click(screen.getByRole("button", { name: "▲" }));

    expect(await screen.findByText("서버 에러")).toBeInTheDocument();
  });
});
