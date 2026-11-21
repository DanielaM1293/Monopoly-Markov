export type Group =
  | 'brown' | 'lightblue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'darkblue'
  | 'rail' | 'util' | 'special';

export interface Square { name: string; es?: string; short: string; group: Group }

export const GROUP_COLOR: Record<Group, string> = {
  brown: '#9a6240', lightblue: '#5cc8f5', pink: '#ec6fb3', orange: '#fb923c', red: '#ef4444',
  yellow: '#eab308', green: '#22a55b', darkblue: '#4256d0', rail: '#64748b', util: '#a8a29e', special: '#8b9bb4',
};

const s = (name: string, group: Group, short?: string, es?: string): Square => ({ name, es, short: short ?? name, group });

export const SQUARES: Square[] = [
  s('GO', 'special', 'GO', 'SALIDA'),
  s('Mediterranean Avenue', 'brown', 'Mediterr.'),
  s('Community Chest', 'special', 'Chest', 'Arca Comunal'),
  s('Baltic Avenue', 'brown', 'Baltic'),
  s('Income Tax', 'special', 'Tax', 'Impuesto sobre la renta'),
  s('Reading Railroad', 'rail', 'Reading'),
  s('Oriental Avenue', 'lightblue', 'Oriental'),
  s('Chance', 'special', 'Chance', 'Suerte'),
  s('Vermont Avenue', 'lightblue', 'Vermont'),
  s('Connecticut Avenue', 'lightblue', 'Connect.'),
  s('Jail / Just Visiting', 'special', 'JAIL', 'Cárcel / De visita'),
  s('St. Charles Place', 'pink', 'St. Charles'),
  s('Electric Company', 'util', 'Electric', 'Compañía eléctrica'),
  s('States Avenue', 'pink', 'States'),
  s('Virginia Avenue', 'pink', 'Virginia'),
  s('Pennsylvania Railroad', 'rail', 'Penn. RR'),
  s('St. James Place', 'orange', 'St. James'),
  s('Community Chest', 'special', 'Chest', 'Arca Comunal'),
  s('Tennessee Avenue', 'orange', 'Tennessee'),
  s('New York Avenue', 'orange', 'New York'),
  s('Free Parking', 'special', 'Parking', 'Parqueo libre'),
  s('Kentucky Avenue', 'red', 'Kentucky'),
  s('Chance', 'special', 'Chance', 'Suerte'),
  s('Indiana Avenue', 'red', 'Indiana'),
  s('Illinois Avenue', 'red', 'Illinois'),
  s('B&O Railroad', 'rail', 'B&O'),
  s('Atlantic Avenue', 'yellow', 'Atlantic'),
  s('Ventnor Avenue', 'yellow', 'Ventnor'),
  s('Water Works', 'util', 'Water', 'Acueducto'),
  s('Marvin Gardens', 'yellow', 'Marvin'),
  s('Go To Jail', 'special', 'Go Jail', 'Ve a la cárcel'),
  s('Pacific Avenue', 'green', 'Pacific'),
  s('North Carolina Avenue', 'green', 'N. Carolina'),
  s('Community Chest', 'special', 'Chest', 'Arca Comunal'),
  s('Pennsylvania Avenue', 'green', 'Penn. Ave'),
  s('Short Line', 'rail', 'Short Line'),
  s('Chance', 'special', 'Chance', 'Suerte'),
  s('Park Place', 'darkblue', 'Park Pl.'),
  s('Luxury Tax', 'special', 'Lux. Tax', 'Impuesto de lujo'),
  s('Boardwalk', 'darkblue', 'Boardwalk'),
];

/** grid position (row, col) on an 11x11 board, GO at bottom-right, clockwise like the real board */
export function gridPos(i: number): [number, number] {
  if (i === 0) return [10, 10];
  if (i < 10) return [10, 10 - i];
  if (i === 10) return [10, 0];
  if (i < 20) return [10 - (i - 10), 0];
  if (i === 20) return [0, 0];
  if (i < 30) return [0, i - 20];
  if (i === 30) return [0, 10];
  return [i - 30, 10];
}

export const isProperty = (i: number) => !['special'].includes(SQUARES[i].group);

export const GROUP_ORDER: Group[] = ['brown', 'lightblue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkblue', 'rail', 'util'];
export const groupSquares = (g: Group) => SQUARES.map((q, i) => (q.group === g ? i : -1)).filter((i) => i >= 0);
