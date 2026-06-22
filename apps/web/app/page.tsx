async function getMessage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function Home() {
  const data = await getMessage();
  return (
    <main>
      <h1>{data.message}</h1>
      <h1>..ㅎㅎ</h1>
    </main>
  );
}
