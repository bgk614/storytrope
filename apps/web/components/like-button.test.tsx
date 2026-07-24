import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/lib/auth-context';
import { likeTrope } from '@/lib/api';
import { LikeButton } from './like-button';

jest.mock('@/lib/api', () => ({
  likeTrope: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

function renderWithAuth(user: { email: string; nickname: string } | null) {
  (useAuth as jest.Mock).mockReturnValue({
    user,
    ready: true,
    setUser: jest.fn(),
  });
  return render(<LikeButton tropeId='trope-1' initialScore={3} />);
}

describe('LikeButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('로그인 안 했으면 클릭 시 에러 메시지, API 호출 안 함', async () => {
    renderWithAuth(null);

    await userEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('Log in to like this.')).toBeInTheDocument();
    expect(likeTrope).not.toHaveBeenCalled();
  });

  it('로그인 상태면 클릭 시 likeTrope 호출, 결과로 점수 갱신', async () => {
    (likeTrope as jest.Mock).mockResolvedValue({ liked: true, likeScore: 4 });
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByText('4')).toBeInTheDocument());
    expect(likeTrope).toHaveBeenCalledWith('trope-1');
  });

  it('API 실패하면 에러 메시지 표시', async () => {
    (likeTrope as jest.Mock).mockRejectedValue(new Error('서버 에러'));
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    await userEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('서버 에러')).toBeInTheDocument();
  });
});
