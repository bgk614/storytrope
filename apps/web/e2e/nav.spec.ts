import { expect, test } from '@playwright/test';

test.describe('네비게이션과 목록 페이지', () => {
  test('홈에서 로그인 안 한 상태면 Log in/Sign up 링크 노출', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });

  test('Tropes 이동 시 fixture 데이터 렌더', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Tropes' }).click();

    await expect(page).toHaveURL(/\/tropes$/);
    await expect(page.getByRole('link', { name: /Chosen One/ })).toBeVisible();
  });

  test('Books 이동 시 fixture 데이터 렌더', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Books' }).click();

    await expect(page).toHaveURL(/\/books$/);
    await expect(page.getByRole('link', { name: /The Fellowship of the Ring/ })).toBeVisible();
  });

  test('Rankings 이동 시 fixture 데이터 렌더', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Rankings' }).click();

    await expect(page).toHaveURL(/\/rankings$/);
    await expect(page.getByRole('link', { name: /Chosen One/ })).toBeVisible();
  });

  test('트로프 상세 페이지가 이름/설명/연결된 책을 렌더', async ({ page }) => {
    await page.goto('/tropes/trope-1');

    await expect(page.getByRole('heading', { name: 'Chosen One' })).toBeVisible();
    await expect(page.getByRole('link', { name: /The Fellowship of the Ring/ })).toBeVisible();
  });

  test('존재하지 않는 트로프는 404', async ({ page }) => {
    const response = await page.goto('/tropes/missing-trope');
    expect(response?.status()).toBe(404);
  });
});
