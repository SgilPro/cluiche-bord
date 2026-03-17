export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">歡迎來到 Cluiche Bord</h1>
        <p className="text-lg text-gray-600">
          在這裡，你可以找到各種有趣的桌遊，加入遊戲，或是創建自己的遊戲！
        </p>
      </section>
      <p className="text-gray-500">
        前端重構中：房間與遊戲將改由 Elixir 後端提供。請見 <code className="bg-gray-100 px-1 rounded">tasks/</code> 與 <code className="bg-gray-100 px-1 rounded">tasks/report.md</code>。
      </p>
    </main>
  );
}
