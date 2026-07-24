import { render, screen } from '@testing-library/react';
import type { Trope } from '@/lib/types';
import { TropeCard } from './trope-card';

const baseTrope: Trope = {
  id: 'trope-1',
  name: 'Chosen One',
  description: null,
  parentId: null,
  likeScore: 3,
  createdAt: '2020-01-01T00:00:00.000Z',
  updatedAt: '2020-01-01T00:00:00.000Z',
};

describe('TropeCard', () => {
  it('이름을 보여주고 /tropes/:id로 링크', () => {
    render(<TropeCard trope={baseTrope} />);

    expect(screen.getByRole('link', { name: /Chosen One/ })).toHaveAttribute(
      'href',
      '/tropes/trope-1',
    );
  });

  it('score prop이 없으면 trope.likeScore를 사용', () => {
    render(<TropeCard trope={baseTrope} />);

    expect(screen.getByText('♥ 3')).toBeInTheDocument();
  });

  it('score prop이 있으면 trope.likeScore 대신 사용', () => {
    render(<TropeCard trope={baseTrope} score={99} />);

    expect(screen.getByText('♥ 99')).toBeInTheDocument();
  });

  it('description이 없으면 렌더링하지 않음', () => {
    render(<TropeCard trope={baseTrope} />);

    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument();
  });

  it('description이 있으면 표시', () => {
    render(<TropeCard trope={{ ...baseTrope, description: '설명입니다' }} />);

    expect(screen.getByText('설명입니다')).toBeInTheDocument();
  });
});
