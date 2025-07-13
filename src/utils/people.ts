import type { Person, Social } from '~/types';

// map the "Platform: value" strings to an icon name + URL
function parseSocial(raw: string): Social | null {
  if (!raw.includes(':')) return null;
  
  const colonIndex = raw.indexOf(':');
  const platform = raw.substring(0, colonIndex).trim().toLowerCase();
  const value = raw.substring(colonIndex + 1).trim();
  
  if (!value) return null;

  let icon: string;
  let href: string;

  switch (platform) {
    case 'x':
    case 'twitter':
      icon = 'tabler:brand-twitter';
      href = value.startsWith('http') ? value : `https://x.com/${value.replace(/^@/, '')}`;
      break;
    case 'github':
      icon = 'tabler:brand-github';
      href = value.startsWith('http') ? value : `https://github.com/${value.replace(/^@/, '')}`;
      break;
    case 'linkedin':
      icon = 'tabler:brand-linkedin';
      href = value.startsWith('http') ? value : `https://linkedin.com/in/${value.replace(/^@/, '')}`;
      break;
    case 'orcid':
      icon = 'tabler:file-spark';
      href = value.startsWith('http') ? value : `https://orcid.org/${value}`;
      break;
    default:
      icon = 'tabler:link';
      href = value;
  }

  return { icon, href };
}

type RawEntry = {
  name: string;
  email: string;
  research: string;
  socials: Record<string, string>;
};

export async function getPeople(rawList: RawEntry[] = []): Promise<Person[]> {
  return rawList.map((entry) => ({
    name: entry.name,
    email: entry.email,
    research: entry.research,
    socials: Object.entries(entry.socials)
      .map(([platform, value]) => parseSocial(`${platform}: ${value}`))
      .filter((s): s is { icon: string; href: string } => s !== null),
  }));
}
