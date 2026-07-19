import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { adminDeleteUser } from "@/lib/api";
import { DeleteUserButton } from "./delete-user-button";

jest.mock("@/lib/api", () => ({
  adminDeleteUser: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

describe("DeleteUserButton", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("확인창에서 취소하면 adminDeleteUser 호출 안 함", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteUserButton userId="user-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(adminDeleteUser).not.toHaveBeenCalled();
  });

  it("확인창에서 승인하면 adminDeleteUser 호출 후 router.refresh", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    (adminDeleteUser as jest.Mock).mockResolvedValue(undefined);
    render(<DeleteUserButton userId="user-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(adminDeleteUser).toHaveBeenCalledWith("user-1");
  });

  it("실패하면 에러 메시지 표시하고 버튼 다시 활성화", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    (adminDeleteUser as jest.Mock).mockRejectedValue(new Error("권한 없음"));
    render(<DeleteUserButton userId="user-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("권한 없음")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).not.toBeDisabled();
  });
});
