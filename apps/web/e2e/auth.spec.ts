import { expect, test } from '@playwright/test';

test.describe('회원가입/로그인/로그아웃', () => {
  test('회원가입 성공하면 홈으로 이동하고 nav에 닉네임 표시', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('Nickname').fill('tester');
    await page.getByLabel('Email').fill('new@test.com');
    await page.getByLabel('Password').fill('pw123456');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('tester')).toBeVisible();
  });

  test('중복 이메일로 가입하면 에러 메시지 표시', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('Nickname').fill('tester');
    await page.getByLabel('Email').fill('dup@test.com');
    await page.getByLabel('Password').fill('pw123456');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('A user with this email already exists')).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('로그인 성공하면 홈으로 이동하고 nav에 닉네임 표시', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('existing@test.com');
    await page.getByLabel('Password').fill('correctpass');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('existing')).toBeVisible();
  });

  test('잘못된 비밀번호면 에러 메시지 표시', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('existing@test.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('로그아웃하면 nav가 로그인 전 상태로 복귀', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'storytrope_user',
        JSON.stringify({ email: 'a@test.com', nickname: 'tester' }),
      );
    });
    await page.goto('/');
    await expect(page.getByText('tester')).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });
});
