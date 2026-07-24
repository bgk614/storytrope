import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { addTropeToBook } from '@/lib/api';
import { AddTropeToBookForm } from './add-trope-to-book-form';

jest.mock('@/lib/api', () => ({
  addTropeToBook: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

function renderWithAuth(user: { email: string; nickname: string } | null) {
  (useAuth as jest.Mock).mockReturnValue({
    user,
    ready: true,
    setUser: jest.fn(),
  });
  (useRouter as jest.Mock).mockReturnValue(router);
  return render(<AddTropeToBookForm bookId='book-1' />);
}

describe('AddTropeToBookForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('로그인 안 했으면 안내 문구만 보여주고 폼 없음', () => {
    renderWithAuth(null);

    expect(screen.getByText('Log in to link a trope to this book.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('제출하면 입력값 trim 후 addTropeToBook 호출, 성공 시 입력 초기화하고 router.refresh', async () => {
    (addTropeToBook as jest.Mock).mockResolvedValue({
      workId: 'book-1',
      tropeId: 'trope-1',
    });
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    const input = screen.getByPlaceholderText("Trope ID (found in the trope's page URL)");
    await userEvent.type(input, '  trope-1  ');
    await userEvent.click(screen.getByRole('button', { name: 'Link Trope' }));

    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(addTropeToBook).toHaveBeenCalledWith('book-1', 'trope-1');
    expect(input).toHaveValue('');
  });

  it('실패하면 에러 메시지 표시', async () => {
    (addTropeToBook as jest.Mock).mockRejectedValue(new Error('이미 연결됨'));
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    await userEvent.type(
      screen.getByPlaceholderText("Trope ID (found in the trope's page URL)"),
      'trope-1',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Link Trope' }));

    expect(await screen.findByText('이미 연결됨')).toBeInTheDocument();
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
