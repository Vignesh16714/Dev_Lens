import type { GitHubUser } from '../types';
import type { RawUser } from '../github/client';

export function normalizeUser(raw: RawUser): GitHubUser {
  return {
    login: raw.login,
    name: raw.name,
    avatarUrl: raw.avatar_url,
    bio: raw.bio,
    company: raw.company,
    location: raw.location,
    blog: raw.blog,
    twitterUsername: raw.twitter_username,
    followers: raw.followers,
    following: raw.following,
    publicRepos: raw.public_repos,
    publicGists: raw.public_gists,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    type: raw.type === 'Organization' ? 'Organization' : 'User',
    hireable: raw.hireable,
  };
}