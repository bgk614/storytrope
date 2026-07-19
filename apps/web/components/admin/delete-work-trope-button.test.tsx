import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { adminDeleteWorkTropeLink } from "@/lib/api";
import { DeleteWorkTropeButton } from "./delete-work-trope-button";

jest.mock("@/lib/api", () => ({
  adminDeleteWorkTropeLink: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

describe("DeleteWorkTropeButton", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("확인창에서 취소하면 adminDeleteWorkTropeLink 호출 안 함", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteWorkTropeButton workId="work-1" tropeId="trope-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(adminDeleteWorkTropeLink).not.toHaveBeenCalled();
  });

  it("확인창에서 승인하면 adminDeleteWorkTropeLink 호출 후 router.refresh", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    (adminDeleteWorkTropeLink as jest.Mock).mockResolvedValue(undefined);
    render(<DeleteWorkTropeButton workId="work-1" tropeId="trope-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(adminDeleteWorkTropeLink).toHaveBeenCalledWith("work-1", "trope-1");
  });

  it("실패하면 에러 메시지 표시하고 버튼 다시 활성화", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
    (adminDeleteWorkTropeLink as jest.Mock).mockRejectedValue(new Error("이미 삭제됨"));
    render(<DeleteWorkTropeButton workId="work-1" tropeId="trope-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(await screen.findByText("이미 삭제됨")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).not.toBeDisabled();
  });
});
