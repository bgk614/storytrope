import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { adminCreateWork, adminDeleteWork, adminUpdateWork } from '@/lib/api';
import type { Work } from '@/lib/types';
import { WorkForm } from './work-form';

jest.mock('@/lib/api', () => ({
  adminCreateWork: jest.fn(),
  adminUpdateWork: jest.fn(),
  adminDeleteWork: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const router = { push: jest.fn(), refresh: jest.fn() };

const existingWork: Work = {
  id: 'work-1',
  title: 'Existing Title',
  description: 'Existing description',
  firstPublishDate: '2020-01-01',
  coverId: 123,
  likeScore: 0,
  authors: [
    {
      workId: 'work-1',
      authorId: 'author-1',
      author: { id: 'author-1', name: 'Jane Doe' },
    },
  ],
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('WorkForm', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('생성 모드', () => {
    it('빈 값으로 시작하고 Delete 버튼 없음', () => {
      render(<WorkForm />);

      expect(screen.getByLabelText('Title')).toHaveValue('');
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('제출하면 authorNames를 분리/trim하고 coverId를 숫자로 변환해서 adminCreateWork 호출', async () => {
      (adminCreateWork as jest.Mock).mockResolvedValue({ id: 'work-2' });
      render(<WorkForm />);

      await userEvent.type(screen.getByLabelText('Title'), 'New Book');
      await userEvent.type(screen.getByLabelText('Cover ID'), '42');
      await userEvent.type(screen.getByLabelText('Authors (comma-separated)'), 'A, B ,  C');
      await userEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith('/admin/works'));
      expect(adminCreateWork).toHaveBeenCalledWith({
        title: 'New Book',
        description: undefined,
        firstPublishDate: undefined,
        coverId: 42,
        authorNames: ['A', 'B', 'C'],
      });
      expect(router.refresh).toHaveBeenCalled();
    });

    it('실패하면 에러 메시지 표시', async () => {
      (adminCreateWork as jest.Mock).mockRejectedValue(new Error('생성 실패'));
      render(<WorkForm />);

      await userEvent.type(screen.getByLabelText('Title'), 'New Book');
      await userEvent.click(screen.getByRole('button', { name: 'Create' }));

      expect(await screen.findByText('생성 실패')).toBeInTheDocument();
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe('수정 모드', () => {
    it('기존 값으로 필드가 채워지고 Delete 버튼 표시', () => {
      render(<WorkForm work={existingWork} />);

      expect(screen.getByLabelText('Title')).toHaveValue('Existing Title');
      expect(screen.getByLabelText('Authors (comma-separated)')).toHaveValue('Jane Doe');
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('제출하면 adminUpdateWork(work.id, dto) 호출', async () => {
      (adminUpdateWork as jest.Mock).mockResolvedValue(existingWork);
      render(<WorkForm work={existingWork} />);

      await userEvent.clear(screen.getByLabelText('Title'));
      await userEvent.type(screen.getByLabelText('Title'), 'Updated Title');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith('/admin/works'));
      expect(adminUpdateWork).toHaveBeenCalledWith(
        'work-1',
        expect.objectContaining({ title: 'Updated Title' }),
      );
    });

    it('Delete 클릭 시 확인창 취소하면 adminDeleteWork 호출 안 함', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      render(<WorkForm work={existingWork} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(adminDeleteWork).not.toHaveBeenCalled();
    });

    it('Delete 클릭 시 확인창 승인하면 adminDeleteWork 호출 후 목록으로 이동', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      (adminDeleteWork as jest.Mock).mockResolvedValue(undefined);
      render(<WorkForm work={existingWork} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => expect(router.push).toHaveBeenCalledWith('/admin/works'));
      expect(adminDeleteWork).toHaveBeenCalledWith('work-1');
      expect(router.refresh).toHaveBeenCalled();
    });
  });
});
