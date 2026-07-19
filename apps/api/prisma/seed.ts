import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { WorkTropeSource } from '../generated/prisma/enums';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 트로프 이름/설명은 직접 작성
// 제목, 저자, 설명, 커버, 날짜 => 실제 Open Library 덤프에서 가져옴

const tropes = [
  {
    name: 'Chosen One',
    description: '선택받은 자, 평범해 보이던 주인공이 사실 세계를 구할 운명을 타고났다는 설정.',
  },
  {
    name: 'Orphan Hero',
    description:
      '부모님을 잃은 영웅, 주인공이 어린 시절 부모를 잃었고, 그 상실이 이후 여정을 이끌어가는 설정.',
  },
  {
    name: "Mentor's Death",
    description:
      '스승의 죽음, 주인공을 이끌어주던 스승이 이야기 중반에 죽으면서 주인공이 급격히 성장하게 되는 설정.',
  },
  {
    name: 'Hidden Royalty',
    description: '숨겨진 왕족, 평민인 줄 알았던 인물이 사실 왕족이나 귀족 혈통이었다는 설정.',
  },
  {
    name: 'Anti-Hero',
    description:
      '안티히어로, 선과 악의 경계가 모호한, 도덕적으로 회색 지대에 있는 주인공이 이야기를 이끌어가는 설정.',
  },
  {
    name: 'Enemies to Lovers',
    description: '적에서 연인으로, 서로 대립하거나 적대하던 두 인물이 점차 사랑에 빠지는 설정.',
  },
  {
    name: 'Love Triangle',
    description: '삼각관계, 두 사람이 한 사람의 애정을 두고 경쟁하는 설정.',
  },
  {
    name: 'Insta-Love',
    description: '첫눈에 반한 사랑, 만난 지 얼마 되지 않아 깊은 사랑에 빠지는 설정.',
  },
] as const;

const authors = {
  rowling: { olKey: '/authors/OL23919A', name: 'J. K. Rowling' },
  tolkien: { olKey: '/authors/OL26320A', name: 'J.R.R. Tolkien' },
  martin: { olKey: '/authors/OL234664A', name: 'George R. R. Martin' },
  meyer: { olKey: '/authors/OL1391085A', name: 'Stephenie Meyer' },
  austen: { olKey: '/authors/OL21594A', name: 'Jane Austen' },
} as const;

const works = [
  {
    olKey: '/works/OL82563W',
    title: "Harry Potter and the Philosopher's Stone",
    description:
      "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his grisly aunt and uncle. Then, on Harry's eleventh birthday, a great beetle-eyed giant of a man called Rubeus Hagrid bursts in with some astonishing news: Harry Potter is a wizard, and he has a place at Hogwarts School of Witchcraft and Wizardry.",
    firstPublishDate: undefined as string | undefined,
    coverId: 15_155_833,
    sourceCreatedAt: '2009-10-17T07:07:29.461716',
    sourceModifiedAt: '2026-06-06T15:54:38.463250',
    authorKey: 'rowling',
    tropeNames: ['Chosen One', 'Orphan Hero'],
  },
  {
    olKey: '/works/OL27513W',
    title: 'The Fellowship of the Ring',
    description:
      'In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, the Dark Lord, forged the One Ring, filling it with his own power so that he could rule all others. But the One Ring was taken from him, and though he sought it throughout Middle-earth, it remained lost to him. After many ages it fell into the hands of Bilbo Baggins, as told in The Hobbit. In a sleepy village in the Shire, young Frodo Baggins finds himself faced with an immense task, as his elderly cousin Bilbo entrusts the Ring to his care. Frodo must leave his home and make a perilous journey across Middle-earth to the Cracks of Doom, there to destroy the Ring and foil the Dark Lord in his evil purpose.',
    firstPublishDate: 'November 12, 1972',
    coverId: 14_627_060,
    sourceCreatedAt: '2009-10-13T02:46:28.838662',
    sourceModifiedAt: '2026-03-30T18:09:40.112603',
    authorKey: 'tolkien',
    tropeNames: ['Chosen One', 'Hidden Royalty', "Mentor's Death"],
  },
  {
    olKey: '/works/OL257943W',
    title: 'A Game of Thrones',
    description:
      'A Game of Thrones is the inaugural novel in A Song of Ice and Fire, an epic series of fantasy novels crafted by the American author George R. R. Martin. Published on August 1, 1996, this novel introduces readers to the richly detailed world of Westeros and Essos, where political intrigue, power struggles, and magical elements intertwine. Set in the fictional continents of Westeros and Essos, the narrative revolves around the power struggles among noble families vying for the Iron Throne, the seat of power in the Seven Kingdoms of Westeros.',
    firstPublishDate: 'January 5, 1998',
    coverId: 9_269_962,
    sourceCreatedAt: '2009-10-24T00:36:36.861649',
    sourceModifiedAt: '2026-06-14T18:27:37.729799',
    authorKey: 'martin',
    tropeNames: ['Hidden Royalty', 'Anti-Hero'],
  },
  {
    olKey: '/works/OL5720023W',
    title: 'Twilight',
    description:
      'About three things I was absolutely positive. First, Edward was a vampire. Second, there was a part of him that thirsted for my blood. And third, I was unconditionally and irrevocably in love with him. When Isabella Swan moves to the gloomy town of Forks and meets the mysterious, alluring Edward Cullen, her life takes a thrilling and terrifying turn. With his porcelain skin, golden eyes, mesmerizing voice, and supernatural gifts, Edward is both irresistible and impenetrable.',
    firstPublishDate: undefined as string | undefined,
    coverId: 12_641_977,
    sourceCreatedAt: '2009-12-10T11:08:50.857829',
    sourceModifiedAt: '2026-02-19T13:32:15.138394',
    authorKey: 'meyer',
    tropeNames: ['Insta-Love', 'Love Triangle'],
  },
  {
    olKey: '/works/OL66554W',
    title: 'Pride and Prejudice',
    description:
      'Pride and Prejudice is an 1813 novel of manners written by Jane Austen. The novel follows the character development of Elizabeth Bennet, the dynamic protagonist of the book who learns about the repercussions of hasty judgments and comes to appreciate the difference between superficial goodness and actual goodness.',
    firstPublishDate: '1853',
    coverId: 14_348_537,
    sourceCreatedAt: '2009-10-16T02:23:26.818127',
    sourceModifiedAt: '2026-04-29T10:44:51.750329',
    authorKey: 'austen',
    tropeNames: ['Enemies to Lovers'],
  },
] as const;

async function seedTestUser() {
  return prisma.user.upsert({
    where: { email: 'testuser01@test.com' },
    update: {},
    create: {
      email: 'testuser01@test.com',
      nickname: 'testuser01',
      passwordHash: 'test',
    },
  });
}

async function seedTropes() {
  const tropeIdByName = new Map<string, string>();
  for (const t of tropes) {
    const trope = await prisma.trope.upsert({
      where: { name: t.name },
      update: { description: t.description },
      create: { name: t.name, description: t.description },
    });
    tropeIdByName.set(t.name, trope.id);
  }
  return tropeIdByName;
}

async function seedAuthors() {
  const authorIdByKey = new Map<keyof typeof authors, string>();
  for (const [key, a] of Object.entries(authors) as [
    keyof typeof authors,
    (typeof authors)[keyof typeof authors],
  ][]) {
    const author = await prisma.author.upsert({
      where: { olKey: a.olKey },
      update: { name: a.name },
      create: { olKey: a.olKey, name: a.name },
    });
    authorIdByKey.set(key, author.id);
  }
  return authorIdByKey;
}

async function seedWorks(
  tropeIdByName: Map<string, string>,
  authorIdByKey: Map<keyof typeof authors, string>,
  adminUserId: string,
) {
  for (const w of works) {
    const work = await prisma.work.upsert({
      where: { olKey: w.olKey },
      update: {
        title: w.title,
        description: w.description,
        firstPublishDate: w.firstPublishDate,
        coverId: w.coverId,
        sourceCreatedAt: new Date(w.sourceCreatedAt),
        sourceModifiedAt: new Date(w.sourceModifiedAt),
      },
      create: {
        olKey: w.olKey,
        title: w.title,
        description: w.description,
        firstPublishDate: w.firstPublishDate,
        coverId: w.coverId,
        sourceCreatedAt: new Date(w.sourceCreatedAt),
        sourceModifiedAt: new Date(w.sourceModifiedAt),
      },
    });

    const authorId = authorIdByKey.get(w.authorKey);
    if (authorId) {
      await prisma.workAuthor.upsert({
        where: { workId_authorId: { workId: work.id, authorId } },
        update: {},
        create: { workId: work.id, authorId },
      });
    }

    for (const tropeName of w.tropeNames) {
      const tropeId = tropeIdByName.get(tropeName);
      if (!tropeId) continue;

      await prisma.workTrope.upsert({
        where: { workId_tropeId: { workId: work.id, tropeId } },
        update: {},
        create: {
          workId: work.id,
          tropeId,
          source: WorkTropeSource.ADMIN,
          createdByUserId: adminUserId,
        },
      });
    }
  }
}

async function main() {
  const testUser = await seedTestUser();
  const tropeIdByName = await seedTropes();
  const authorIdByKey = await seedAuthors();
  await seedWorks(tropeIdByName, authorIdByKey, testUser.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    throw error;
  });
