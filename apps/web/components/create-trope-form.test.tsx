import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createTrope } from '@/lib/api';
import { CreateTropeForm } from './create-trope-form';

jest.mock('@/lib/api', () => ({
  createTrope: jest.fn(),
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
  return render(<CreateTropeForm />);
}

describe('CreateTropeForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('처음엔 New Trope 버튼만 보이고 폼은 숨김', () => {
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    expect(screen.getByRole('button', { name: 'New Trope' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('New Trope 클릭하면 폼이 열리고 Cancel로 다시 닫힘', async () => {
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    await userEvent.click(screen.getByRole('button', { name: 'New Trope' }));
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('로그인 안 한 상태로 제출하면 에러, createTrope 호출 안 함', async () => {
    renderWithAuth(null);

    await userEvent.click(screen.getByRole('button', { name: 'New Trope' }));
    await userEvent.type(screen.getByLabelText('Name'), 'New Trope Name');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Log in to create a trope.')).toBeInTheDocument();
    expect(createTrope).not.toHaveBeenCalled();
  });

  it('설명 없이 제출하면 description undefined로 호출, 성공 시 상세 페이지로 이동', async () => {
    (createTrope as jest.Mock).mockResolvedValue({ id: 'trope-1' });
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    await userEvent.click(screen.getByRole('button', { name: 'New Trope' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Chosen One');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/tropes/trope-1'));
    expect(createTrope).toHaveBeenCalledWith({
      name: 'Chosen One',
      description: undefined,
    });
    expect(router.refresh).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'New Trope' })).toBeInTheDocument();
  });

  it('실패하면 에러 메시지 표시하고 폼 유지', async () => {
    (createTrope as jest.Mock).mockRejectedValue(new Error('이미 존재하는 이름'));
    renderWithAuth({ email: 'a@test.com', nickname: 'tester' });

    await userEvent.click(screen.getByRole('button', { name: 'New Trope' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Chosen One');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('이미 존재하는 이름')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
