import {
	ancestorsOf,
	buildFolderTree,
	findFolder,
	inFolder,
	labelFromSlug,
	skillFolder,
	toSkillRows
} from './skill-folders';
import { describe, expect, it } from 'vitest';

describe('labelFromSlug', () => {
	it('title-cases slugs and upper-cases known acronyms', () => {
		expect(labelFromSlug('payables-receivables')).toBe('Payables Receivables');
		expect(labelFromSlug('seo')).toBe('SEO');
		expect(labelFromSlug('ai_search')).toBe('AI Search');
		expect(labelFromSlug('')).toBe('');
	});
});

describe('skillFolder', () => {
	it('returns the folders above the skill, without a leading skills/ folder', () => {
		expect(skillFolder({ relativePath: 'skills/accounting/tax/sales-tax' })).toEqual([
			'Accounting',
			'Tax'
		]);
		expect(skillFolder({ relativePath: 'engineering/devops/terraform' })).toEqual([
			'Engineering',
			'Devops'
		]);
	});

	it('puts skills at the top of the repository in no folder', () => {
		expect(skillFolder({ relativePath: 'skills/pdf' })).toEqual([]);
		expect(skillFolder({ relativePath: 'pdf' })).toEqual([]);
		expect(skillFolder({})).toEqual([]);
	});
});

describe('folder browser', () => {
	const rows = toSkillRows(
		[
			'skills/accounting/tax/sales-tax',
			'skills/accounting/platforms/xero/xero-close',
			'skills/accounting/platforms/qbo/qbo-close',
			'skills/seo/ai-search/visibility',
			'skills/loose-skill'
		].map((relativePath, i) => ({ id: `s${i}`, type: 'skill', relativePath }))
	);

	it('keeps the skill fields and adds the folder', () => {
		expect(rows[1]).toMatchObject({
			id: 's1',
			folder: ['Accounting', 'Platforms', 'Xero'],
			folderPath: 'Accounting / Platforms / Xero'
		});
		expect(rows[4].folder).toEqual([]);
	});

	it('builds a sorted tree whose counts include subfolders', () => {
		const tree = buildFolderTree(rows);
		expect(tree.count).toBe(5);
		expect(tree.children.map((c) => `${c.name}:${c.count}`)).toEqual(['Accounting:3', 'SEO:1']);
		const platforms = findFolder(tree, 'Accounting/Platforms');
		expect(platforms?.count).toBe(2);
		expect(platforms?.children.map((c) => c.path)).toEqual([
			'Accounting/Platforms/Qbo',
			'Accounting/Platforms/Xero'
		]);
		expect(findFolder(tree, '')).toBe(tree);
		expect(findFolder(tree, 'Nope/Missing')).toBeUndefined();
	});

	it('filters by folder, with or without subfolders', () => {
		const paths = (path: string, deep: boolean) =>
			rows.filter((r) => inFolder(r, path, deep)).map((r) => r.relativePath);
		expect(paths('', true)).toHaveLength(5);
		expect(paths('', false)).toEqual(['skills/loose-skill']);
		expect(paths('Accounting', true)).toHaveLength(3);
		expect(paths('Accounting', false)).toEqual([]);
		expect(paths('Accounting/Tax', false)).toEqual(['skills/accounting/tax/sales-tax']);
		expect(paths('Account', true)).toEqual([]);
	});

	it('lists the ancestors of a folder for breadcrumbs', () => {
		expect(ancestorsOf('')).toEqual([]);
		expect(ancestorsOf('A/B/C')).toEqual(['A', 'A/B', 'A/B/C']);
	});
});
