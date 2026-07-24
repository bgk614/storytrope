import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './auth-context';

const STORAGE_KEY = 'storytrope_user';

function Consumer() {
  const { user, ready, setUser } = useAuth();
  return (
    <div>
      <span data-testid='ready'>{String(ready)}</span>
      <span data-testid='user'>{user ? user.nickname : '없음'}</span>
      <button onClick={() => setUser({ email: 'a@test.com', nickname: 'tester' })}>로그인</button>
      <button onClick={() => setUser(null)}>로그아웃</button>
    </div>
  );
}

describe('AuthProvider/useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Provider 없이 useAuth 호출하면 에러', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Broken() {
      useAuth();
      return null;
    }
    expect(() => render(<Broken />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });

  it('localStorage에 저장된 값이 없으면 user는 null', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    expect(screen.getByTestId('user')).toHaveTextContent('없음');
  });

  it('localStorage에 저장된 유저를 초기값으로 읽음', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email: 'a@test.com', nickname: '기존유저' }),
    );

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user')).toHaveTextContent('기존유저');
  });

  it('깨진 JSON이 저장돼 있으면 무시하고 localStorage에서 제거', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user')).toHaveTextContent('없음');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('setUser 호출 시 localStorage에 반영되고 화면도 갱신', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText('로그인'));

    expect(screen.getByTestId('user')).toHaveTextContent('tester');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
      email: 'a@test.com',
      nickname: 'tester',
    });

    await userEvent.click(screen.getByText('로그아웃'));

    expect(screen.getByTestId('user')).toHaveTextContent('없음');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('다른 컴포넌트에서 setUser하면 이 컴포넌트도 동기화', async () => {
    function OtherWriter() {
      const { setUser } = useAuth();
      return (
        <button onClick={() => setUser({ email: 'b@test.com', nickname: '다른곳' })}>
          다른곳에서 로그인
        </button>
      );
    }

    render(
      <AuthProvider>
        <Consumer />
        <OtherWriter />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText('다른곳에서 로그인'));

    expect(screen.getByTestId('user')).toHaveTextContent('다른곳');
  });
});
