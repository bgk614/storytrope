import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { login, signup } from '@/lib/api';
import SignupPage from './page';

jest.mock('@/lib/api', () => ({
  login: jest.fn(),
  signup: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Nickname'), 'tester');
  await userEvent.type(screen.getByLabelText('Email'), 'a@test.com');
  await userEvent.type(screen.getByLabelText('Password'), 'pw123456');
  await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
}

describe('SignupPage', () => {
  const setUser = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(router);
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      ready: true,
      setUser,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('가입 성공하면 signup 후 login까지 호출하고 setUser, 홈으로 이동', async () => {
    (signup as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      nickname: 'tester',
    });
    (login as jest.Mock).mockResolvedValue({ success: true });
    render(<SignupPage />);

    await fillAndSubmit();

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/'));
    expect(signup).toHaveBeenCalledWith('a@test.com', 'pw123456', 'tester');
    expect(login).toHaveBeenCalledWith('a@test.com', 'pw123456');
    expect(setUser).toHaveBeenCalledWith({
      email: 'a@test.com',
      nickname: 'tester',
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it('signup이 실패하면 에러만 표시하고 login은 호출 안 함', async () => {
    (signup as jest.Mock).mockRejectedValue(new Error('이미 가입된 이메일'));
    render(<SignupPage />);

    await fillAndSubmit();

    expect(await screen.findByText('이미 가입된 이메일')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    expect(setUser).not.toHaveBeenCalled();
  });

  it('signup은 성공했지만 이어지는 login이 실패하면 에러 표시', async () => {
    (signup as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      nickname: 'tester',
    });
    (login as jest.Mock).mockRejectedValue(new Error('로그인 실패'));
    render(<SignupPage />);

    await fillAndSubmit();

    expect(await screen.findByText('로그인 실패')).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
  });
});
