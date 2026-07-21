-- Open Library dump(works/authors)에서 표지+설명이 있는 work만 추려
-- Work/Author/Subject/WorkAuthor/WorkSubject 형태의 CSV로 만듦
--
-- 사용법 (scripts/duckdb/ 에서 실행):
--   1) data/ 아래에 ol_dump_works_*.txt.gz, ol_dump_authors_*.txt.gz 준비
--   2) duckdb -c ".read extract.sql"
--   3) data/out/ 에 CSV 5종 생성
--
-- dump 한 줄 포맷: type, key, revision, last_modified, json (탭 구분)
-- key(/works/OL..W, /authors/OL..A)를 olKey 자연키로 남겨서 재적재 시 매칭에 사용

INSTALL json;
LOAD json;

CREATE OR REPLACE TABLE raw_works AS
SELECT * FROM read_csv(
  'data/ol_dump_works_*.txt.gz',
  delim = '\t',
  header = false,
  quote = '',
  escape = '',
  columns = {
    'type': 'VARCHAR',
    'key': 'VARCHAR',
    'revision': 'INTEGER',
    'last_modified': 'VARCHAR',
    'json': 'VARCHAR'
  }
);

CREATE OR REPLACE TABLE raw_authors AS
SELECT * FROM read_csv(
  'data/ol_dump_authors_*.txt.gz',
  delim = '\t',
  header = false,
  quote = '',
  escape = '',
  columns = {
    'type': 'VARCHAR',
    'key': 'VARCHAR',
    'revision': 'INTEGER',
    'last_modified': 'VARCHAR',
    'json': 'VARCHAR'
  }
);

-- description은 dump에서 문자열 또는 {type, value} 객체 두 형태로 섞여 있음
CREATE OR REPLACE TABLE works_with_description AS
SELECT
  *,
  CASE json_type(json->'description')
    WHEN 'VARCHAR' THEN json->>'description'
    ELSE json->'description'->>'value'
  END AS description
FROM raw_works
WHERE type = '/type/work';

-- 표지 + 설명이 모두 있는 work만 남김 (트로프를 붙일 대상이므로 최소한의 정보가 필요)
CREATE OR REPLACE TABLE filtered_works AS
SELECT
  key AS ol_key,
  json,
  json->>'title' AS title,
  description,
  json->>'first_publish_date' AS first_publish_date,
  TRY_CAST(json->'covers'->>0 AS INTEGER) AS cover_id,
  TRY_CAST(COALESCE(json->'created'->>'value', last_modified) AS TIMESTAMP) AS source_created_at,
  TRY_CAST(COALESCE(json->'last_modified'->>'value', last_modified) AS TIMESTAMP) AS source_modified_at
FROM works_with_description
WHERE json_array_length(json->'covers') > 0
  AND description IS NOT NULL;

COPY (
  SELECT
    ol_key AS "olKey",
    title,
    description,
    first_publish_date AS "firstPublishDate",
    cover_id AS "coverId",
    source_created_at AS "sourceCreatedAt",
    source_modified_at AS "sourceModifiedAt"
  FROM filtered_works
  WHERE title IS NOT NULL
) TO 'data/out/work.csv' (HEADER, DELIMITER ',');

-- work -> author 참조 (필터링된 work 안에서만)
CREATE OR REPLACE TABLE work_author_refs AS
SELECT
  ol_key AS work_ol_key,
  UNNEST(json_extract_string(json, '$.authors[*].author.key')) AS author_ol_key
FROM filtered_works;

COPY (
  SELECT DISTINCT work_ol_key AS "workOlKey", author_ol_key AS "authorOlKey"
  FROM work_author_refs
  WHERE author_ol_key IS NOT NULL
) TO 'data/out/work_author.csv' (HEADER, DELIMITER ',');

-- 참조된 author만 추림 (전체 author dump는 work보다 큼)
COPY (
  SELECT DISTINCT
    a.key AS "olKey",
    a.json->>'name' AS name
  FROM raw_authors a
  WHERE a.type = '/type/author'
    AND (a.json->>'name') IS NOT NULL
    AND a.key IN (SELECT DISTINCT author_ol_key FROM work_author_refs WHERE author_ol_key IS NOT NULL)
) TO 'data/out/author.csv' (HEADER, DELIMITER ',');

-- work -> subject(장르) 참조. Subject는 olKey가 없고 name이 자연키
CREATE OR REPLACE TABLE work_subject_refs AS
SELECT
  ol_key AS work_ol_key,
  UNNEST(json_extract_string(json, '$.subjects[*]')) AS subject_name
FROM filtered_works;

COPY (
  SELECT DISTINCT subject_name AS name
  FROM work_subject_refs
  WHERE subject_name IS NOT NULL
) TO 'data/out/subject.csv' (HEADER, DELIMITER ',');

COPY (
  SELECT DISTINCT work_ol_key AS "workOlKey", subject_name AS "subjectName"
  FROM work_subject_refs
  WHERE subject_name IS NOT NULL
) TO 'data/out/work_subject.csv' (HEADER, DELIMITER ',');
