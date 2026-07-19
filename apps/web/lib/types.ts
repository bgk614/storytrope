export interface Trope {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  likeScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  name: string;
}

export interface WorkAuthor {
  workId: string;
  authorId: string;
  author?: Author;
}

export interface Work {
  id: string;
  title: string;
  description: string | null;
  firstPublishDate: string | null;
  coverId: number | null;
  likeScore: number;
  authors?: WorkAuthor[];
  createdAt: string;
  updatedAt: string;
}

export type WorkTropeSource = "AI" | "USER" | "ADMIN";
export type VoteType = "UP" | "DOWN";

export interface WorkTrope {
  workId: string;
  tropeId: string;
  source: WorkTropeSource;
  aiConfidence: number | null;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
  trope?: Trope;
  work?: Work;
}

export interface RankingEntry {
  trope: Trope;
  score: number;
}

export type RankingPeriod = "weekly" | "monthly" | "yearly";

export interface ApiUser {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export type Role = "USER" | "ADMIN";

export interface AdminUser {
  id: string;
  email: string;
  nickname: string;
  role: Role;
}

export interface AdminWorkTropeLink {
  workId: string;
  tropeId: string;
  source: WorkTropeSource;
  voteScore: number;
  createdAt: string;
  createdByUserId: string | null;
  work: { id: string; title: string };
  trope: { id: string; name: string };
}
