import type { CollectionEntry } from 'astro:content'
import type { Language } from '@/i18n/config'
import type { Post } from '@/types'
import { getCollection, render } from 'astro:content'
import { defaultLocale } from '@/config'
import { memoize } from '@/utils/cache'

const metaCache = new Map<string, { minutes: number }>()
const uncategorizedArchive = '未归档'

export interface ArchiveLink {
  name: string
  path: string
  count?: number
}

export interface ArchiveTreeNode {
  name: string
  path: string
  count: number
  isCurrentArchive: boolean
  isCurrentBranch: boolean
  children: ArchiveTreeNode[]
  posts: Post[]
}

export function parseArchiveSegments(archive?: string): string[] {
  const normalized = archive?.trim()
  if (!normalized) {
    return [uncategorizedArchive]
  }

  const segments = normalized
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean)

  return segments.length > 0 ? segments : [uncategorizedArchive]
}

export function getArchivePathFromSegments(segments: string[]): string {
  return segments.join('/')
}

export function getPostArchiveSegments(post: CollectionEntry<'posts'>): string[] {
  return parseArchiveSegments(post.data.archive)
}

export function getPostArchivePath(post: CollectionEntry<'posts'>): string {
  return getArchivePathFromSegments(getPostArchiveSegments(post))
}

export function getArchiveBreadcrumbs(archivePath: string): ArchiveLink[] {
  const segments = parseArchiveSegments(archivePath)

  return segments.map((name, index) => ({
    name,
    path: getArchivePathFromSegments(segments.slice(0, index + 1)),
  }))
}

function isArchiveSubtreeMatch(postSegments: string[], targetSegments: string[]): boolean {
  if (targetSegments.length > postSegments.length) {
    return false
  }

  return targetSegments.every((segment, index) => postSegments[index] === segment)
}

function isExactArchiveMatch(postSegments: string[], targetSegments: string[]): boolean {
  return postSegments.length === targetSegments.length
    && isArchiveSubtreeMatch(postSegments, targetSegments)
}

function getArchiveSubtreePostCount(posts: Post[], targetSegments: string[]): number {
  return posts.filter(post =>
    isArchiveSubtreeMatch(getPostArchiveSegments(post), targetSegments),
  ).length
}

function getSortedDirectChildArchivePaths(posts: Post[], parentSegments: string[]): string[] {
  const childMap = new Map<string, { latest: number, count: number, name: string }>()

  posts.forEach((post) => {
    const postSegments = getPostArchiveSegments(post)
    if (!isArchiveSubtreeMatch(postSegments, parentSegments) || postSegments.length <= parentSegments.length) {
      return
    }

    const childSegments = postSegments.slice(0, parentSegments.length + 1)
    const childPath = getArchivePathFromSegments(childSegments)
    const childName = childSegments[childSegments.length - 1]
    const latest = post.data.published.valueOf()
    const existing = childMap.get(childPath)

    if (existing) {
      existing.latest = Math.max(existing.latest, latest)
      existing.count += 1
      return
    }

    childMap.set(childPath, {
      latest,
      count: 1,
      name: childName,
    })
  })

  return [...childMap.entries()]
    .sort((a, b) =>
      b[1].latest - a[1].latest
      || b[1].count - a[1].count
      || a[1].name.localeCompare(b[1].name, 'zh-Hans-CN'),
    )
    .map(([path]) => path)
}

function buildArchiveTreeNode(
  posts: Post[],
  archivePath: string,
  currentArchiveSegments: string[],
): ArchiveTreeNode {
  const nodeSegments = parseArchiveSegments(archivePath)
  const isCurrentArchive = isExactArchiveMatch(currentArchiveSegments, nodeSegments)
  const isCurrentBranch = isArchiveSubtreeMatch(currentArchiveSegments, nodeSegments)
  const childPaths = getSortedDirectChildArchivePaths(posts, nodeSegments)

  return {
    name: nodeSegments[nodeSegments.length - 1],
    path: archivePath,
    count: getArchiveSubtreePostCount(posts, nodeSegments),
    isCurrentArchive,
    isCurrentBranch,
    children: isCurrentBranch
      ? childPaths.map(childPath => buildArchiveTreeNode(posts, childPath, currentArchiveSegments))
      : [],
    posts: isCurrentArchive
      ? posts.filter(post =>
          isExactArchiveMatch(getPostArchiveSegments(post), nodeSegments),
        )
      : [],
  }
}

/**
 * Add metadata including reading time to a post
 *
 * @param post The post to enhance with metadata
 * @returns Enhanced post with reading time information
 */
async function addMetaToPost(post: CollectionEntry<'posts'>): Promise<Post> {
  const cacheKey = `${post.id}-${post.data.lang || 'universal'}`
  const cachedMeta = metaCache.get(cacheKey)
  if (cachedMeta) {
    return {
      ...post,
      remarkPluginFrontmatter: cachedMeta,
    }
  }

  const { remarkPluginFrontmatter } = await render(post)
  const meta = remarkPluginFrontmatter as { minutes: number }
  metaCache.set(cacheKey, meta)

  return {
    ...post,
    remarkPluginFrontmatter: meta,
  }
}

/**
 * Find duplicate post slugs within the same language
 *
 * @param posts Array of blog posts to check
 * @returns Array of descriptive error messages for duplicate slugs
 */
export async function checkPostSlugDuplication(posts: CollectionEntry<'posts'>[]): Promise<string[]> {
  const slugMap = new Map<string, Set<string>>()
  const duplicates: string[] = []

  posts.forEach((post) => {
    const lang = post.data.lang
    const slug = post.data.abbrlink || post.id

    let slugSet = slugMap.get(lang)
    if (!slugSet) {
      slugSet = new Set()
      slugMap.set(lang, slugSet)
    }

    if (!slugSet.has(slug)) {
      slugSet.add(slug)
      return
    }

    if (!lang) {
      duplicates.push(`Duplicate slug "${slug}" found in universal post (applies to all languages)`)
    }
    else {
      duplicates.push(`Duplicate slug "${slug}" found in "${lang}" language post`)
    }
  })

  return duplicates
}

/**
 * Get all posts (including pinned ones, excluding drafts in production)
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Posts filtered by language, enhanced with metadata, sorted by date
 */
async function _getPosts(lang?: Language) {
  const currentLang = lang || defaultLocale

  const filteredPosts = await getCollection(
    'posts',
    ({ data }: CollectionEntry<'posts'>) => {
      // Show drafts in dev mode only
      const shouldInclude = import.meta.env.DEV || !data.draft
      return shouldInclude && (data.lang === currentLang || data.lang === '')
    },
  )

  const enhancedPosts = await Promise.all(filteredPosts.map(addMetaToPost))

  return enhancedPosts.sort((a, b) =>
    b.data.published.valueOf() - a.data.published.valueOf(),
  )
}

export const getPosts = memoize(_getPosts)

/**
 * Get all non-pinned posts
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Regular posts (non-pinned), filtered by language
 */
async function _getRegularPosts(lang?: Language) {
  const posts = await getPosts(lang)
  return posts.filter(post => !post.data.pin)
}

export const getRegularPosts = memoize(_getRegularPosts)

/**
 * Get pinned posts sorted by pin priority
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Pinned posts sorted by pin value in descending order
 */
async function _getPinnedPosts(lang?: Language) {
  const posts = await getPosts(lang)
  return posts
    .filter(post => post.data.pin && post.data.pin > 0)
    .sort((a, b) => (b.data.pin ?? 0) - (a.data.pin ?? 0))
}

export const getPinnedPosts = memoize(_getPinnedPosts)

/**
 * Group posts by year and sort within each year
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Map of posts grouped by year (descending), sorted by date within each year
 */
async function _getPostsByYear(lang?: Language): Promise<Map<number, Post[]>> {
  const posts = await getRegularPosts(lang)
  const yearMap = new Map<number, Post[]>()

  posts.forEach((post: Post) => {
    const year = post.data.published.getFullYear()
    let yearPosts = yearMap.get(year)
    if (!yearPosts) {
      yearPosts = []
      yearMap.set(year, yearPosts)
    }
    yearPosts.push(post)
  })

  // Sort posts within each year by date
  yearMap.forEach((yearPosts) => {
    yearPosts.sort((a, b) => {
      const aDate = a.data.published
      const bDate = b.data.published
      return bDate.getMonth() - aDate.getMonth() || bDate.getDate() - aDate.getDate()
    })
  })

  return new Map([...yearMap.entries()].sort((a, b) => b[0] - a[0]))
}

export const getPostsByYear = memoize(_getPostsByYear)

/**
 * Get top-level archives and all posts under each subtree
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Top-level archive groups with descendant posts sorted by recent activity
 */
async function _getTopLevelArchiveGroups(lang?: Language) {
  const posts = await getPosts(lang)
  const archiveMap = new Map<string, Post[]>()

  posts.forEach((post: Post) => {
    const topLevelArchive = getPostArchiveSegments(post)[0]
    let archivePosts = archiveMap.get(topLevelArchive)
    if (!archivePosts) {
      archivePosts = []
      archiveMap.set(topLevelArchive, archivePosts)
    }
    archivePosts.push(post)
  })

  archiveMap.forEach((archivePosts) => {
    archivePosts.sort((a, b) =>
      b.data.published.valueOf() - a.data.published.valueOf(),
    )
  })

  return new Map(
    [...archiveMap.entries()].sort((a, b) => {
      const latestA = a[1][0]?.data.published.valueOf() ?? 0
      const latestB = b[1][0]?.data.published.valueOf() ?? 0
      return latestB - latestA
        || b[1].length - a[1].length
        || a[0].localeCompare(b[0], 'zh-Hans-CN')
    }),
  )
}

export const getTopLevelArchiveGroups = memoize(_getTopLevelArchiveGroups)

/**
 * Get top-level archives with descendant post counts
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Archive links for the `/archives/` index page
 */
async function _getTopLevelArchives(lang?: Language): Promise<ArchiveLink[]> {
  const archiveMap = await getTopLevelArchiveGroups(lang)

  return Array.from(archiveMap.entries(), ([name, posts]) => ({
    name,
    path: name,
    count: posts.length,
  }))
}

export const getTopLevelArchives = memoize(_getTopLevelArchives)

/**
 * Get all archive node paths, including intermediate parents
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns All archive nodes that should have pages
 */
async function _getAllArchiveNodePaths(lang?: Language): Promise<string[]> {
  const posts = await getPosts(lang)
  const archivePaths = new Set<string>()

  posts.forEach((post) => {
    const segments = getPostArchiveSegments(post)
    for (let index = 1; index <= segments.length; index++) {
      archivePaths.add(getArchivePathFromSegments(segments.slice(0, index)))
    }
  })

  return [...archivePaths].sort((a, b) => {
    const aSegments = parseArchiveSegments(a)
    const bSegments = parseArchiveSegments(b)

    return aSegments.length - bSegments.length
      || a.localeCompare(b, 'zh-Hans-CN')
  })
}

export const getAllArchiveNodePaths = memoize(_getAllArchiveNodePaths)

/**
 * Get direct child archives of the current archive node
 *
 * @param archivePath Current archive node path
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Direct child archives with descendant post counts
 */
async function _getDirectChildArchives(archivePath: string, lang?: Language): Promise<ArchiveLink[]> {
  const posts = await getPosts(lang)
  const parentSegments = parseArchiveSegments(archivePath)
  const childMap = new Map<string, { name: string, path: string, count: number, latest: number }>()

  posts.forEach((post) => {
    const postSegments = getPostArchiveSegments(post)
    if (!isArchiveSubtreeMatch(postSegments, parentSegments) || postSegments.length <= parentSegments.length) {
      return
    }

    const childSegments = postSegments.slice(0, parentSegments.length + 1)
    const childPath = getArchivePathFromSegments(childSegments)
    const childName = childSegments[childSegments.length - 1]
    const latest = post.data.published.valueOf()
    const existing = childMap.get(childPath)

    if (existing) {
      existing.count += 1
      existing.latest = Math.max(existing.latest, latest)
      return
    }

    childMap.set(childPath, {
      name: childName,
      path: childPath,
      count: 1,
      latest,
    })
  })

  return [...childMap.values()]
    .sort((a, b) =>
      b.latest - a.latest
      || b.count - a.count
      || a.name.localeCompare(b.name, 'zh-Hans-CN'),
    )
    .map(({ name, path, count }) => ({ name, path, count }))
}

export const getDirectChildArchives = memoize(_getDirectChildArchives)

/**
 * Get posts mounted directly on the current archive node
 *
 * @param archivePath Current archive node path
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Posts assigned to the exact archive path
 */
async function _getPostsByArchive(archivePath: string, lang?: Language) {
  const posts = await getPosts(lang)
  const targetSegments = parseArchiveSegments(archivePath)

  return posts.filter(post =>
    isExactArchiveMatch(getPostArchiveSegments(post), targetSegments),
  )
}

export const getPostsByArchive = memoize(_getPostsByArchive)

/**
 * Check which languages support a specific archive node
 *
 * @param archivePath Archive node path
 * @returns Array of language codes that contain this archive node or descendants
 */
async function _getArchiveSupportedLangs(archivePath: string): Promise<Language[]> {
  const posts = await getCollection(
    'posts',
    ({ data }) => !data.draft,
  )
  const targetSegments = parseArchiveSegments(archivePath)
  const { allLocales } = await import('@/config')

  return allLocales.filter(locale =>
    posts.some((post) => {
      const postSegments = getPostArchiveSegments(post)
      return isArchiveSubtreeMatch(postSegments, targetSegments)
        && (post.data.lang === locale || post.data.lang === '')
    }),
  )
}

export const getArchiveSupportedLangs = memoize(_getArchiveSupportedLangs)

/**
 * Build a visible archive tree for the current article path
 *
 * @param archivePath Current article archive path
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Top-level archive nodes with only the current branch expanded
 */
async function _getArchiveTreeForPath(archivePath: string, lang?: Language): Promise<ArchiveTreeNode[]> {
  const posts = await getPosts(lang)
  const currentArchiveSegments = parseArchiveSegments(archivePath)
  const topLevelPaths = [...new Set(posts.map(post => getPostArchiveSegments(post)[0]))]

  return topLevelPaths
    .map(topLevelPath => buildArchiveTreeNode(posts, topLevelPath, currentArchiveSegments))
    .sort((a, b) =>
      Number(b.isCurrentBranch) - Number(a.isCurrentBranch)
      || b.count - a.count
      || a.name.localeCompare(b.name, 'zh-Hans-CN'),
    )
}

export const getArchiveTreeForPath = memoize(_getArchiveTreeForPath)

/**
 * Group posts by their tags
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Map where keys are tag names and values are arrays of posts with that tag
 */
async function _getPostsGroupByTags(lang?: Language) {
  const posts = await getPosts(lang)
  const tagMap = new Map<string, Post[]>()

  posts.forEach((post: Post) => {
    post.data.tags?.forEach((tag: string) => {
      let tagPosts = tagMap.get(tag)
      if (!tagPosts) {
        tagPosts = []
        tagMap.set(tag, tagPosts)
      }
      tagPosts.push(post)
    })
  })

  return tagMap
}

export const getPostsGroupByTags = memoize(_getPostsGroupByTags)

/**
 * Get all tags sorted by post count
 *
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Array of tags sorted by popularity (most posts first)
 */
async function _getAllTags(lang?: Language) {
  const tagMap = await getPostsGroupByTags(lang)
  const tagsWithCount = Array.from(tagMap.entries())

  tagsWithCount.sort((a, b) => b[1].length - a[1].length)
  return tagsWithCount.map(([tag]) => tag)
}

export const getAllTags = memoize(_getAllTags)

/**
 * Get all posts that contain a specific tag
 *
 * @param tag The tag name to filter posts by
 * @param lang The language code to filter by, defaults to site's default language
 * @returns Array of posts that contain the specified tag
 */
async function _getPostsByTag(tag: string, lang?: Language) {
  const tagMap = await getPostsGroupByTags(lang)
  return tagMap.get(tag) ?? []
}

export const getPostsByTag = memoize(_getPostsByTag)

/**
 * Check which languages support a specific tag
 *
 * @param tag The tag name to check language support for
 * @returns Array of language codes that support the specified tag
 */
async function _getTagSupportedLangs(tag: string): Promise<Language[]> {
  const posts = await getCollection(
    'posts',
    ({ data }) => !data.draft,
  )
  const { allLocales } = await import('@/config')

  return allLocales.filter(locale =>
    posts.some(post =>
      post.data.tags?.includes(tag)
      && (post.data.lang === locale || post.data.lang === ''),
    ),
  )
}

export const getTagSupportedLangs = memoize(_getTagSupportedLangs)
