import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { logout } from "@/lib/api";
import { NavBar } from "./nav-bar";

jest.mock("@/lib/api", () => ({
  logout: jest.fn(),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

function renderWithAuth(opts: { user: { nickname: string } | null; ready: boolean }) {
  const setUser = jest.fn();
  (useAuth as jest.Mock).mockReturnValue({ ...opts, setUser });
  (useRouter as jest.Mock).mockReturnValue(router);
  render(<NavBar />);
  return { setUser };
}

describe("NavBar", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("ready가 false면 로그인 관련 UI를 안 보여줌", () => {
    renderWithAuth({ user: null, ready: false });

    expect(screen.queryByText("Log in")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign up")).not.toBeInTheDocument();
  });

  it("로그인 안 한 상태면 Log in/Sign up 링크 표시", () => {
    renderWithAuth({ user: null, ready: true });

    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.getByText("Sign up")).toBeInTheDocument();
  });

  it("로그인 상태면 닉네임과 로그아웃 버튼 표시", () => {
    renderWithAuth({ user: { nickname: "tester" }, ready: true });

    expect(screen.getByText("tester")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("로그아웃 클릭하면 apiLogout 호출 후 setUser(null), 홈으로 이동", async () => {
    (logout as jest.Mock).mockResolvedValue({ success: true });
    const { setUser } = renderWithAuth({ user: { nickname: "tester" }, ready: true });

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(logout).toHaveBeenCalled();
    expect(setUser).toHaveBeenCalledWith(null);
    expect(router.refresh).toHaveBeenCalled();
  });

  it("apiLogout이 실패해도 로컬 상태는 정리하고 홈으로 이동", async () => {
    (logout as jest.Mock).mockRejectedValue(new Error("세션 없음"));
    const { setUser } = renderWithAuth({ user: { nickname: "tester" }, ready: true });

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
    expect(setUser).toHaveBeenCalledWith(null);
  });
});
