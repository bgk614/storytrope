import { expect, test } from "@playwright/test";

test.describe("로그인 상태에서의 좋아요/투표", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "storytrope_user",
        JSON.stringify({ email: "a@test.com", nickname: "tester" }),
      );
    });
  });

  test("트로프 상세에서 좋아요 클릭하면 점수 갱신", async ({ page }) => {
    await page.goto("/tropes/trope-1");

    const likeButton = page.getByRole("button", { name: /♥/ });
    await expect(likeButton).toHaveText("♥5");
    await likeButton.click();

    await expect(likeButton).toHaveText("♥6");
  });

  test("책 상세에서 업보트 클릭하면 점수 갱신", async ({ page }) => {
    await page.goto("/books/work-1");

    const upvote = page.getByRole("button", { name: "▲" });
    await upvote.click();

    await expect(page.getByText("1", { exact: true })).toBeVisible();
  });
});

test.describe("비로그인 상태에서의 좋아요", () => {
  test("좋아요 클릭하면 로그인 안내만 뜨고 점수는 그대로", async ({ page }) => {
    await page.goto("/tropes/trope-1");

    const likeButton = page.getByRole("button", { name: /♥/ });
    await likeButton.click();

    await expect(page.getByText("Log in to like this.")).toBeVisible();
    await expect(likeButton).toHaveText("♥5");
  });
});
