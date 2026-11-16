-- A project can now link several source repositories (e.g. portfolio, CMS, API).
-- Replaces the single "repoUrl" column with "repos": [{ "label": string, "url": string }].

ALTER TABLE "Project" ADD COLUMN "repos" JSONB NOT NULL DEFAULT '[]';

-- Keep existing links: move each repoUrl into the new list.
UPDATE "Project"
SET "repos" = jsonb_build_array(jsonb_build_object('label', 'Source', 'url', "repoUrl"))
WHERE "repoUrl" IS NOT NULL AND "repoUrl" <> '';

ALTER TABLE "Project" DROP COLUMN "repoUrl";
