import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addBookToTrope } from "@/lib/api";
import { AddBookToTropeForm } from "./add-book-to-trope-form";

jest.mock("@/lib/api", () => ({
  addBookToTrope: jest.fn(),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

function renderWithAuth(user: { email: string; nickname: string } | null) {
  (useAuth as jest.Mock).mockReturnValue({ user, ready: true, setUser: jest.fn() });
  (useRouter as jest.Mock).mockReturnValue(router);
  return render(<AddBookToTropeForm tropeId="trope-1" />);
}

describe("AddBookToTropeForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("로그인 안 했으면 안내 문구만 보여주고 폼 없음", () => {
    renderWithAuth(null);

    expect(screen.getByText("Log in to link a book to this trope.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("제출하면 입력값 trim 후 addBookToTrope 호출, 성공 시 입력 초기화하고 router.refresh", async () => {
    (addBookToTrope as jest.Mock).mockResolvedValue({ workId: "work-1", tropeId: "trope-1" });
    renderWithAuth({ email: "a@test.com", nickname: "tester" });

    const input = screen.getByPlaceholderText("Book ID (found in the book's page URL)");
    await userEvent.type(input, "  work-1  ");
    await userEvent.click(screen.getByRole("button", { name: "Link Book" }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(addBookToTrope).toHaveBeenCalledWith("trope-1", "work-1");
    expect(input).toHaveValue("");
  });

  it("실패하면 에러 메시지 표시", async () => {
    (addBookToTrope as jest.Mock).mockRejectedValue(new Error("이미 연결됨"));
    renderWithAuth({ email: "a@test.com", nickname: "tester" });

    await userEvent.type(
      screen.getByPlaceholderText("Book ID (found in the book's page URL)"),
      "work-1",
    );
    await userEvent.click(screen.getByRole("button", { name: "Link Book" }));

    expect(await screen.findByText("이미 연결됨")).toBeInTheDocument();
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
