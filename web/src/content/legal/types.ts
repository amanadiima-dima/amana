// A legal page is a list of sections; a block is a paragraph, a bullet list or a table.
// Text may contain {legalName}, {address}, {privacyEmail}, {euRepresentative} (filled from COMPANY).
export type LegalBlock = string | { list: string[] } | { table: { head: string[]; rows: string[][] } };
export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };
export type LegalDoc = { intro: string; sections: LegalSection[] };
