import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { login } from '@/lib/api';
import LoginPage from './page';

jest.mock('@/lib/api', () => ({
  login: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

describe('LoginPage', () => {
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

  it('로그인 성공하면 login 호출 후 setUser, 홈으로 이동', async () => {
    (login as jest.Mock).mockResolvedValue({ success: true });
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'a@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'pw1234');
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/'));
    expect(login).toHaveBeenCalledWith('a@test.com', 'pw1234');
    expect(setUser).toHaveBeenCalledWith({
      email: 'a@test.com',
      nickname: 'a',
    });
    expect(router.refresh).toHaveBeenCalled();
  });

  it('로그인 실패하면 에러 메시지 표시, setUser 호출 안 함', async () => {
    (login as jest.Mock).mockRejectedValue(new Error('비밀번호가 틀렸습니다'));
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'a@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByText('비밀번호가 틀렸습니다')).toBeInTheDocument();
    expect(setUser).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});
