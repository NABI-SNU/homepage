// src/utils/get-people.ts
export interface Social {
  icon: string;
  href: string;
}

export interface Person {
  name: string;
  email: string;
  research: string;
  socials: Social[];
}

// map the “Platform: value” strings to an icon name + URL
function parseSocial(raw: string): Social | null {
  if (!raw.includes(':')) return null;
  const [plat, rest] = raw.split(':').map(s => s.trim());
  if (!rest) return null;

  let icon: string;
  let href = rest;

  switch (plat.toLowerCase()) {
    case 'x':
    case 'twitter':
      icon = 'tabler:brand-twitter';
      if (!rest.startsWith('http')) href = `https://x.com/${rest.replace(/^@/, '')}`;
      break;
    case 'github':
      icon = 'tabler:brand-github';
      href = rest.startsWith('http') ? rest : `https://github.com/${rest.replace(/^@/, '')}`;
      break;
    case 'linkedin':
      icon = 'tabler:brand-linkedin';
      break;
    case 'orcid':
      icon = 'tabler:file-spark';
      break;
    default:
      icon = 'tabler:link';
  }

  return { icon, href };
}

type RawEntry = {
  name: string;
  email: string;
  research: string;
  socials: string[];
};

export async function getPeople(
  rawList: RawEntry[] = []
): Promise<Person[]> {  
  return rawList.map(entry => ({
    name: entry.name,
    email: entry.email,
    research: entry.research,
    socials: entry.socials
      .map(parseSocial)
      .filter((s): s is { icon: string; href: string } => s !== null),
  }));
}
