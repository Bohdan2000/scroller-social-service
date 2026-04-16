-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "FriendRequestStatus" AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE "GroupMemberRole" AS ENUM ('owner', 'admin', 'member');

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE "profiles" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"      TEXT        NOT NULL,
    "username"     TEXT        NOT NULL,
    "display_name" TEXT,
    "bio"          TEXT,
    "avatar_url"   TEXT,
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profiles_user_id_key"  ON "profiles"("user_id");
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

CREATE TABLE "topics" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "slug"       TEXT        NOT NULL,
    "title"      TEXT        NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

CREATE TABLE "user_topic_preferences" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID        NOT NULL,
    "topic_id"   UUID        NOT NULL,
    "weight"     FLOAT       NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "user_topic_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_topic_preferences_profile_id_topic_id_key"
    ON "user_topic_preferences"("profile_id", "topic_id");
CREATE INDEX "user_topic_preferences_profile_id_idx"
    ON "user_topic_preferences"("profile_id");

CREATE TABLE "friend_requests" (
    "id"                   UUID                   NOT NULL DEFAULT gen_random_uuid(),
    "requester_profile_id" UUID                   NOT NULL,
    "target_profile_id"    UUID                   NOT NULL,
    "status"               "FriendRequestStatus"  NOT NULL DEFAULT 'pending',
    "created_at"           TIMESTAMPTZ            NOT NULL DEFAULT now(),
    "updated_at"           TIMESTAMPTZ            NOT NULL DEFAULT now(),

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "friend_requests_requester_profile_id_target_profile_id_key"
    ON "friend_requests"("requester_profile_id", "target_profile_id");
CREATE INDEX "friend_requests_requester_profile_id_idx"
    ON "friend_requests"("requester_profile_id");
CREATE INDEX "friend_requests_target_profile_id_idx"
    ON "friend_requests"("target_profile_id");

CREATE TABLE "friendships" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "profile_a_id" UUID        NOT NULL,
    "profile_b_id" UUID        NOT NULL,
    "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "friendships_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "friendships_ordered_check" CHECK (profile_a_id < profile_b_id)
);

CREATE UNIQUE INDEX "friendships_profile_a_id_profile_b_id_key"
    ON "friendships"("profile_a_id", "profile_b_id");
CREATE INDEX "friendships_profile_a_id_idx" ON "friendships"("profile_a_id");
CREATE INDEX "friendships_profile_b_id_idx" ON "friendships"("profile_b_id");

CREATE TABLE "groups" (
    "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
    "owner_profile_id" UUID        NOT NULL,
    "name"             TEXT        NOT NULL,
    "description"      TEXT,
    "is_private"       BOOLEAN     NOT NULL DEFAULT false,
    "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "groups_owner_profile_id_idx" ON "groups"("owner_profile_id");

CREATE TABLE "group_members" (
    "id"         UUID             NOT NULL DEFAULT gen_random_uuid(),
    "group_id"   UUID             NOT NULL,
    "profile_id" UUID             NOT NULL,
    "role"       "GroupMemberRole" NOT NULL DEFAULT 'member',
    "joined_at"  TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "group_members_group_id_profile_id_key"
    ON "group_members"("group_id", "profile_id");
CREATE INDEX "group_members_group_id_idx"   ON "group_members"("group_id");
CREATE INDEX "group_members_profile_id_idx" ON "group_members"("profile_id");

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

ALTER TABLE "user_topic_preferences"
    ADD CONSTRAINT "user_topic_preferences_profile_id_fkey"
        FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "user_topic_preferences_topic_id_fkey"
        FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE;

ALTER TABLE "friend_requests"
    ADD CONSTRAINT "friend_requests_requester_profile_id_fkey"
        FOREIGN KEY ("requester_profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "friend_requests_target_profile_id_fkey"
        FOREIGN KEY ("target_profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

ALTER TABLE "friendships"
    ADD CONSTRAINT "friendships_profile_a_id_fkey"
        FOREIGN KEY ("profile_a_id") REFERENCES "profiles"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "friendships_profile_b_id_fkey"
        FOREIGN KEY ("profile_b_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

ALTER TABLE "groups"
    ADD CONSTRAINT "groups_owner_profile_id_fkey"
        FOREIGN KEY ("owner_profile_id") REFERENCES "profiles"("id");

ALTER TABLE "group_members"
    ADD CONSTRAINT "group_members_group_id_fkey"
        FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE,
    ADD CONSTRAINT "group_members_profile_id_fkey"
        FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON "profiles"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER friend_requests_set_updated_at
    BEFORE UPDATE ON "friend_requests"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER groups_set_updated_at
    BEFORE UPDATE ON "groups"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
