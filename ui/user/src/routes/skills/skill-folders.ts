import type { Skill } from '$lib/services';

export type SkillRow = Skill & { folder: string[]; folderPath: string };

export type FolderNode = { name: string; path: string; count: number; children: FolderNode[] };

const ACRONYMS = new Set([
	'ai',
	'api',
	'aws',
	'ci',
	'cli',
	'gcp',
	'hr',
	'it',
	'llm',
	'mcp',
	'qa',
	'seo',
	'sql',
	'ui',
	'ux'
]);

/** "payables-receivables" -> "Payables Receivables", "seo" -> "SEO". */
export function labelFromSlug(slug: string): string {
	return slug
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((word) =>
			ACRONYMS.has(word.toLowerCase())
				? word.toUpperCase()
				: word.charAt(0).toUpperCase() + word.slice(1)
		)
		.join(' ');
}

/**
 * The folders a skill sits in, as labels: "skills/accounting/platforms/xero/month-end-close"
 * -> ["Accounting", "Platforms", "Xero"]. The skill's own folder and a leading "skills/" folder
 * are not part of it, so a skill at the top of the repository has no folder.
 */
export function skillFolder(skill: { relativePath?: string }): string[] {
	const parts = (skill.relativePath ?? '').split('/').filter(Boolean);
	const inside = parts[0] === 'skills' ? parts.slice(1) : parts;
	return inside.slice(0, -1).map(labelFromSlug);
}

export function toSkillRows(skills: Skill[]): SkillRow[] {
	return skills.map((skill) => {
		const folder = skillFolder(skill);
		return { ...skill, folder, folderPath: folder.join(' / ') };
	});
}

/** Folder tree for the folder browser; `path` is the labels joined by "/", counts include subfolders. */
export function buildFolderTree(rows: { folder: string[] }[]): FolderNode {
	const root: FolderNode = { name: '', path: '', count: 0, children: [] };
	for (const row of rows) {
		let node = root;
		node.count++;
		row.folder.forEach((name, i) => {
			let child = node.children.find((c) => c.name === name);
			if (!child) {
				child = { name, path: row.folder.slice(0, i + 1).join('/'), count: 0, children: [] };
				node.children.push(child);
			}
			child.count++;
			node = child;
		});
	}
	const sort = (node: FolderNode) => {
		node.children.sort((a, b) => a.name.localeCompare(b.name));
		node.children.forEach(sort);
	};
	sort(root);
	return root;
}

export function findFolder(root: FolderNode, path: string): FolderNode | undefined {
	if (!path) return root;
	return path
		.split('/')
		.reduce<
			FolderNode | undefined
		>((node, name) => node?.children.find((c) => c.name === name), root);
}

/** Is the row in the folder at `path`? The root ("") holds everything when subfolders are included. */
export function inFolder(
	row: { folder: string[] },
	path: string,
	includeSubfolders: boolean
): boolean {
	const parts = path ? path.split('/') : [];
	if (!parts.every((name, i) => row.folder[i] === name)) return false;
	return includeSubfolders || row.folder.length === parts.length;
}

/** "a/b/c" -> ["a", "a/b", "a/b/c"], for breadcrumbs and keeping the selected branch open. */
export function ancestorsOf(path: string): string[] {
	return path ? path.split('/').map((_, i, parts) => parts.slice(0, i + 1).join('/')) : [];
}
