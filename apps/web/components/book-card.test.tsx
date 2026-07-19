import { render, screen } from "@testing-library/react";
import type { Work } from "@/lib/types";
import { BookCard } from "./book-card";

const baseWork: Work = {
  id: "work-1",
  title: "The Fellowship of the Ring",
  description: null,
  firstPublishDate: null,
  coverId: null,
  likeScore: 0,
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
};

describe("BookCard", () => {
  it("제목을 보여주고 /books/:id로 링크", () => {
    render(<BookCard work={baseWork} />);

    const link = screen.getByRole("link", { name: /The Fellowship of the Ring/ });
    expect(link).toHaveAttribute("href", "/books/work-1");
  });

  it("저자가 있으면 이름을 콤마로 이어서 표시", () => {
    render(
      <BookCard
        work={{
          ...baseWork,
          authors: [
            { workId: "work-1", authorId: "a1", author: { id: "a1", name: "J.R.R. Tolkien" } },
            { workId: "work-1", authorId: "a2", author: { id: "a2", name: "Christopher Tolkien" } },
          ],
        }}
      />,
    );

    expect(screen.getByText("J.R.R. Tolkien, Christopher Tolkien")).toBeInTheDocument();
  });

  it("저자/출간일 없으면 해당 문구를 렌더링하지 않음", () => {
    render(<BookCard work={baseWork} />);

    expect(screen.queryByText(/Tolkien/)).not.toBeInTheDocument();
  });

  it("출간일이 있으면 표시", () => {
    render(<BookCard work={{ ...baseWork, firstPublishDate: "November 12, 1972" }} />);

    expect(screen.getByText("November 12, 1972")).toBeInTheDocument();
  });
});
