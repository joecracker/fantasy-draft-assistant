import { DraftPlayer } from './types';

export const ADDITIONAL_PLAYERS_SHORT: {
  name: string;
  team: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';
  byeWeek: number;
  adp: number;
  projectedPointsStd: number;
  projectedPointsPpr: number;
}[] = [
  // --- ADDITIONAL QBs ---
  { name: 'Trevor Lawrence', team: 'JAX', position: 'QB', byeWeek: 12, adp: 115.4, projectedPointsStd: 242.5, projectedPointsPpr: 242.5 },
  { name: 'Kirk Cousins', team: 'ATL', position: 'QB', byeWeek: 11, adp: 118.2, projectedPointsStd: 248.1, projectedPointsPpr: 248.1 },
  { name: 'Justin Herbert', team: 'LAC', position: 'QB', byeWeek: 5, adp: 122.5, projectedPointsStd: 238.4, projectedPointsPpr: 238.4 },
  { name: 'Aaron Rodgers', team: 'NYJ', position: 'QB', byeWeek: 12, adp: 128.1, projectedPointsStd: 230.2, projectedPointsPpr: 230.2 },
  { name: 'Matthew Stafford', team: 'LAR', position: 'QB', byeWeek: 6, adp: 132.4, projectedPointsStd: 228.4, projectedPointsPpr: 228.4 },
  { name: 'Baker Mayfield', team: 'TB', position: 'QB', byeWeek: 11, adp: 135.8, projectedPointsStd: 234.5, projectedPointsPpr: 234.5 },
  { name: 'Deshaun Watson', team: 'CLE', position: 'QB', byeWeek: 10, adp: 138.2, projectedPointsStd: 222.1, projectedPointsPpr: 222.1 },
  { name: 'Geno Smith', team: 'SEA', position: 'QB', byeWeek: 10, adp: 142.4, projectedPointsStd: 218.4, projectedPointsPpr: 218.4 },
  { name: 'Will Levis', team: 'TEN', position: 'QB', byeWeek: 5, adp: 148.5, projectedPointsStd: 212.1, projectedPointsPpr: 212.1 },
  { name: 'Bryce Young', team: 'CAR', position: 'QB', byeWeek: 11, adp: 154.2, projectedPointsStd: 205.4, projectedPointsPpr: 205.4 },
  { name: 'Russell Wilson', team: 'PIT', position: 'QB', byeWeek: 9, adp: 158.1, projectedPointsStd: 208.5, projectedPointsPpr: 208.5 },
  { name: 'Derek Carr', team: 'NO', position: 'QB', byeWeek: 12, adp: 161.4, projectedPointsStd: 202.1, projectedPointsPpr: 202.1 },
  { name: 'Daniel Jones', team: 'NYG', position: 'QB', byeWeek: 11, adp: 165.2, projectedPointsStd: 198.4, projectedPointsPpr: 198.4 },
  { name: 'Drake Maye', team: 'NE', position: 'QB', byeWeek: 14, adp: 168.5, projectedPointsStd: 192.5, projectedPointsPpr: 192.5 },
  { name: 'Bo Nix', team: 'DEN', position: 'QB', byeWeek: 14, adp: 172.4, projectedPointsStd: 188.1, projectedPointsPpr: 188.1 },
  { name: 'Sam Darnold', team: 'MIN', position: 'QB', byeWeek: 6, adp: 175.2, projectedPointsStd: 194.2, projectedPointsPpr: 194.2 },
  { name: 'Gardner Minshew II', team: 'LV', position: 'QB', byeWeek: 6, adp: 178.5, projectedPointsStd: 182.4, projectedPointsPpr: 182.4 },
  { name: 'Justin Fields', team: 'PIT', position: 'QB', byeWeek: 9, adp: 182.1, projectedPointsStd: 175.0, projectedPointsPpr: 175.0 },
  { name: 'Jacoby Brissett', team: 'NE', position: 'QB', byeWeek: 14, adp: 188.4, projectedPointsStd: 162.0, projectedPointsPpr: 162.0 },

  // --- ADDITIONAL RBs ---
  { name: 'Raheem Mostert', team: 'MIA', position: 'RB', byeWeek: 6, adp: 74.2, projectedPointsStd: 148.4, projectedPointsPpr: 168.1 },
  { name: 'Najee Harris', team: 'PIT', position: 'RB', byeWeek: 9, adp: 68.5, projectedPointsStd: 152.1, projectedPointsPpr: 182.4 },
  { name: 'Jaylen Warren', team: 'PIT', position: 'RB', byeWeek: 9, adp: 81.2, projectedPointsStd: 124.5, projectedPointsPpr: 168.2 },
  { name: 'Tony Pollard', team: 'TEN', position: 'RB', byeWeek: 5, adp: 84.5, projectedPointsStd: 132.4, projectedPointsPpr: 174.5 },
  { name: 'Tyjae Spears', team: 'TEN', position: 'RB', byeWeek: 5, adp: 92.1, projectedPointsStd: 118.5, projectedPointsPpr: 158.4 },
  { name: 'Brian Robinson Jr.', team: 'WAS', position: 'RB', byeWeek: 14, adp: 88.4, projectedPointsStd: 142.1, projectedPointsPpr: 172.5 },
  { name: 'Austin Ekeler', team: 'WAS', position: 'RB', byeWeek: 14, adp: 95.8, projectedPointsStd: 112.5, projectedPointsPpr: 155.4 },
  { name: 'Zack Moss', team: 'CIN', position: 'RB', byeWeek: 7, adp: 86.2, projectedPointsStd: 138.1, projectedPointsPpr: 168.2 },
  { name: 'Chase Brown', team: 'CIN', position: 'RB', byeWeek: 7, adp: 102.4, projectedPointsStd: 114.5, projectedPointsPpr: 148.1 },
  { name: 'Trey Benson', team: 'ARI', position: 'RB', byeWeek: 11, adp: 105.1, projectedPointsStd: 112.4, projectedPointsPpr: 135.2 },
  { name: 'Devin Singletary', team: 'NYG', position: 'RB', byeWeek: 11, adp: 98.5, projectedPointsStd: 134.2, projectedPointsPpr: 168.4 },
  { name: 'Jerome Ford', team: 'CLE', position: 'RB', byeWeek: 10, adp: 108.2, projectedPointsStd: 118.5, projectedPointsPpr: 154.2 },
  { name: 'Nick Chubb', team: 'CLE', position: 'RB', byeWeek: 10, adp: 78.4, projectedPointsStd: 132.1, projectedPointsPpr: 152.0 },
  { name: 'Ezekiel Elliott', team: 'DAL', position: 'RB', byeWeek: 7, adp: 112.5, projectedPointsStd: 118.4, projectedPointsPpr: 148.5 },
  { name: 'Rico Dowdle', team: 'DAL', position: 'RB', byeWeek: 7, adp: 124.1, projectedPointsStd: 102.4, projectedPointsPpr: 132.5 },
  { name: 'Gus Edwards', team: 'LAC', position: 'RB', byeWeek: 5, adp: 115.2, projectedPointsStd: 128.4, projectedPointsPpr: 142.1 },
  { name: 'J.K. Dobbins', team: 'LAC', position: 'RB', byeWeek: 5, adp: 138.4, projectedPointsStd: 98.2, projectedPointsPpr: 118.5 },
  { name: 'Javonte Williams', team: 'DEN', position: 'RB', byeWeek: 14, adp: 96.1, projectedPointsStd: 122.5, projectedPointsPpr: 162.4 },
  { name: 'Jaleel McLaughlin', team: 'DEN', position: 'RB', byeWeek: 14, adp: 142.5, projectedPointsStd: 92.1, projectedPointsPpr: 125.4 },
  { name: 'Ty Chandler', team: 'MIN', position: 'RB', byeWeek: 6, adp: 135.2, projectedPointsStd: 98.4, projectedPointsPpr: 128.2 },
  { name: 'Chuba Hubbard', team: 'CAR', position: 'RB', byeWeek: 11, adp: 118.4, projectedPointsStd: 114.2, projectedPointsPpr: 142.5 },
  { name: 'Jonathon Brooks', team: 'CAR', position: 'RB', byeWeek: 11, adp: 85.1, projectedPointsStd: 138.4, projectedPointsPpr: 168.2 },
  { name: 'Tyler Allgeier', team: 'ATL', position: 'RB', byeWeek: 11, adp: 128.5, projectedPointsStd: 104.2, projectedPointsPpr: 122.1 },
  { name: 'Roschon Johnson', team: 'CHI', position: 'RB', byeWeek: 7, adp: 156.4, projectedPointsStd: 85.2, projectedPointsPpr: 112.4 },
  { name: 'Khalil Herbert', team: 'CHI', position: 'RB', byeWeek: 7, adp: 146.1, projectedPointsStd: 95.4, projectedPointsPpr: 118.2 },
  { name: 'Antonio Gibson', team: 'NE', position: 'RB', byeWeek: 14, adp: 145.2, projectedPointsStd: 88.4, projectedPointsPpr: 118.5 },
  { name: 'Blake Corum', team: 'LAR', position: 'RB', byeWeek: 6, adp: 108.5, projectedPointsStd: 110.2, projectedPointsPpr: 128.4 },
  { name: 'MarShawn Lloyd', team: 'GB', position: 'RB', byeWeek: 10, adp: 132.1, projectedPointsStd: 98.4, projectedPointsPpr: 118.2 },
  { name: 'Ray Davis', team: 'BUF', position: 'RB', byeWeek: 12, adp: 148.2, projectedPointsStd: 92.5, projectedPointsPpr: 114.1 },
  { name: 'Bucky Irving', team: 'TB', position: 'RB', byeWeek: 11, adp: 152.4, projectedPointsStd: 88.5, projectedPointsPpr: 112.0 },
  { name: 'Jaylen Wright', team: 'MIA', position: 'RB', byeWeek: 6, adp: 139.1, projectedPointsStd: 94.2, projectedPointsPpr: 112.5 },
  { name: 'Kendre Miller', team: 'NO', position: 'RB', byeWeek: 12, adp: 144.5, projectedPointsStd: 95.1, projectedPointsPpr: 114.2 },
  { name: 'AJ Dillon', team: 'GB', position: 'RB', byeWeek: 10, adp: 168.2, projectedPointsStd: 78.4, projectedPointsPpr: 98.5 },
  { name: 'Elijah Mitchell', team: 'SF', position: 'RB', byeWeek: 9, adp: 172.1, projectedPointsStd: 74.2, projectedPointsPpr: 88.4 },
  { name: 'Kenneth Gainwell', team: 'PHI', position: 'RB', byeWeek: 5, adp: 165.4, projectedPointsStd: 76.1, projectedPointsPpr: 99.5 },
  { name: 'Justice Hill', team: 'BAL', position: 'RB', byeWeek: 14, adp: 158.2, projectedPointsStd: 78.2, projectedPointsPpr: 112.4 },
  { name: 'Dameon Pierce', team: 'HOU', position: 'RB', byeWeek: 14, adp: 160.5, projectedPointsStd: 82.4, projectedPointsPpr: 98.2 },
  { name: 'Alexander Mattison', team: 'LV', position: 'RB', byeWeek: 6, adp: 162.4, projectedPointsStd: 84.1, projectedPointsPpr: 105.4 },
  { name: 'Samaje Perine', team: 'KC', position: 'RB', byeWeek: 6, adp: 166.1, projectedPointsStd: 68.2, projectedPointsPpr: 102.5 },
  { name: 'Jamaal Williams', team: 'NO', position: 'RB', byeWeek: 12, adp: 174.5, projectedPointsStd: 72.1, projectedPointsPpr: 92.5 },
  { name: 'Clyde Edwards-Helaire', team: 'KC', position: 'RB', byeWeek: 6, adp: 178.2, projectedPointsStd: 68.4, projectedPointsPpr: 88.4 },

  // --- ADDITIONAL WRs ---
  { name: 'George Pickens', team: 'PIT', position: 'WR', byeWeek: 9, adp: 52.5, projectedPointsStd: 145.4, projectedPointsPpr: 198.2 },
  { name: 'Terry McLaurin', team: 'WAS', position: 'WR', byeWeek: 14, adp: 62.4, projectedPointsStd: 132.1, projectedPointsPpr: 194.2 },
  { name: 'Keenan Allen', team: 'CHI', position: 'WR', byeWeek: 7, adp: 64.1, projectedPointsStd: 118.5, projectedPointsPpr: 188.4 },
  { name: 'Chris Godwin', team: 'TB', position: 'WR', byeWeek: 11, adp: 66.8, projectedPointsStd: 120.4, projectedPointsPpr: 185.1 },
  { name: 'Rashee Rice', team: 'KC', position: 'WR', byeWeek: 6, adp: 58.2, projectedPointsStd: 135.2, projectedPointsPpr: 195.4 },
  { name: 'Amari Cooper', team: 'CLE', position: 'WR', byeWeek: 10, adp: 55.4, projectedPointsStd: 138.4, projectedPointsPpr: 192.1 },
  { name: 'Christian Kirk', team: 'JAX', position: 'WR', byeWeek: 12, adp: 68.2, projectedPointsStd: 124.5, projectedPointsPpr: 182.4 },
  { name: 'Calvin Ridley', team: 'TEN', position: 'WR', byeWeek: 5, adp: 72.5, projectedPointsStd: 128.4, projectedPointsPpr: 178.5 },
  { name: 'DeAndre Hopkins', team: 'TEN', position: 'WR', byeWeek: 5, adp: 85.4, projectedPointsStd: 118.5, projectedPointsPpr: 168.2 },
  { name: 'Diontae Johnson', team: 'CAR', position: 'WR', byeWeek: 11, adp: 78.1, projectedPointsStd: 112.4, projectedPointsPpr: 172.5 },
  { name: 'Jaxon Smith-Njigba', team: 'SEA', position: 'WR', byeWeek: 10, adp: 82.5, projectedPointsStd: 114.5, projectedPointsPpr: 168.4 },
  { name: 'Jordan Addison', team: 'MIN', position: 'WR', byeWeek: 6, adp: 76.4, projectedPointsStd: 122.1, projectedPointsPpr: 165.2 },
  { name: 'Jayden Reed', team: 'GB', position: 'WR', byeWeek: 10, adp: 70.2, projectedPointsStd: 120.5, projectedPointsPpr: 168.1 },
  { name: 'Tyler Lockett', team: 'SEA', position: 'WR', byeWeek: 10, adp: 102.1, projectedPointsStd: 104.2, projectedPointsPpr: 148.5 },
  { name: 'Jameson Williams', team: 'DET', position: 'WR', byeWeek: 5, adp: 95.4, projectedPointsStd: 112.1, projectedPointsPpr: 145.2 },
  { name: 'Christian Watson', team: 'GB', position: 'WR', byeWeek: 10, adp: 91.2, projectedPointsStd: 115.4, projectedPointsPpr: 144.1 },
  { name: 'Romeo Doubs', team: 'GB', position: 'WR', byeWeek: 10, adp: 118.5, projectedPointsStd: 102.4, projectedPointsPpr: 138.2 },
  { name: 'Dontayvion Wicks', team: 'GB', position: 'WR', byeWeek: 10, adp: 128.2, projectedPointsStd: 98.4, projectedPointsPpr: 132.5 },
  { name: 'Courtland Sutton', team: 'DEN', position: 'WR', byeWeek: 14, adp: 108.4, projectedPointsStd: 114.5, projectedPointsPpr: 145.2 },
  { name: 'Keon Coleman', team: 'BUF', position: 'WR', byeWeek: 12, adp: 88.5, projectedPointsStd: 110.2, projectedPointsPpr: 148.4 },
  { name: 'Rome Odunze', team: 'CHI', position: 'WR', byeWeek: 7, adp: 86.4, projectedPointsStd: 112.1, projectedPointsPpr: 152.0 },
  { name: 'Xavier Worthy', team: 'KC', position: 'WR', byeWeek: 6, adp: 75.1, projectedPointsStd: 114.5, projectedPointsPpr: 155.2 },
  { name: 'Ladd McConkey', team: 'LAC', position: 'WR', byeWeek: 5, adp: 80.2, projectedPointsStd: 108.4, projectedPointsPpr: 158.1 },
  { name: 'Brian Thomas Jr.', team: 'JAX', position: 'WR', byeWeek: 12, adp: 92.5, projectedPointsStd: 112.5, projectedPointsPpr: 146.2 },
  { name: 'Khalil Shakir', team: 'BUF', position: 'WR', byeWeek: 12, adp: 110.4, projectedPointsStd: 105.1, projectedPointsPpr: 142.1 },
  { name: 'Curtis Samuel', team: 'BUF', position: 'WR', byeWeek: 12, adp: 115.2, projectedPointsStd: 98.4, projectedPointsPpr: 138.4 },
  { name: 'Josh Palmer', team: 'LAC', position: 'WR', byeWeek: 5, adp: 122.1, projectedPointsStd: 102.1, projectedPointsPpr: 136.2 },
  { name: 'Adonai Mitchell', team: 'IND', position: 'WR', byeWeek: 14, adp: 125.4, projectedPointsStd: 98.5, projectedPointsPpr: 132.0 },
  { name: 'Josh Downs', team: 'IND', position: 'WR', byeWeek: 14, adp: 112.1, projectedPointsStd: 92.4, projectedPointsPpr: 135.2 },
  { name: 'Jakobi Meyers', team: 'LV', position: 'WR', byeWeek: 6, adp: 105.6, projectedPointsStd: 105.2, projectedPointsPpr: 148.2 },
  { name: 'Jerry Jeudy', team: 'CLE', position: 'WR', byeWeek: 10, adp: 124.5, projectedPointsStd: 94.2, projectedPointsPpr: 132.4 },
  { name: 'Adam Thielen', team: 'CAR', position: 'WR', byeWeek: 11, adp: 135.1, projectedPointsStd: 88.4, projectedPointsPpr: 135.2 },
  { name: 'Demario Douglas', team: 'NE', position: 'WR', byeWeek: 14, adp: 142.4, projectedPointsStd: 82.1, projectedPointsPpr: 122.1 },
  { name: 'Michael Wilson', team: 'ARI', position: 'WR', byeWeek: 11, adp: 145.2, projectedPointsStd: 94.5, projectedPointsPpr: 124.1 },
  { name: 'Greg Dortch', team: 'ARI', position: 'WR', byeWeek: 11, adp: 156.4, projectedPointsStd: 78.4, projectedPointsPpr: 118.2 },
  { name: 'Jahan Dotson', team: 'PHI', position: 'WR', byeWeek: 5, adp: 148.1, projectedPointsStd: 85.2, projectedPointsPpr: 118.4 },
  { name: 'Wan\'Dale Robinson', team: 'NYG', position: 'WR', byeWeek: 11, adp: 138.2, projectedPointsStd: 82.4, projectedPointsPpr: 128.5 },
  { name: 'Rashid Shaheed', team: 'NO', position: 'WR', byeWeek: 12, adp: 114.5, projectedPointsStd: 102.1, projectedPointsPpr: 138.2 },
  { name: 'Brandin Cooks', team: 'DAL', position: 'WR', byeWeek: 7, adp: 120.2, projectedPointsStd: 98.4, projectedPointsPpr: 135.1 },
  { name: 'Gabe Davis', team: 'JAX', position: 'WR', byeWeek: 12, adp: 130.4, projectedPointsStd: 95.1, projectedPointsPpr: 125.4 },
  { name: 'Darnell Mooney', team: 'ATL', position: 'WR', byeWeek: 11, adp: 139.5, projectedPointsStd: 92.1, projectedPointsPpr: 124.5 },
  { name: 'Marvin Mims Jr.', team: 'DEN', position: 'WR', byeWeek: 14, adp: 155.1, projectedPointsStd: 85.4, projectedPointsPpr: 114.2 },
  { name: 'Elijah Moore', team: 'CLE', position: 'WR', byeWeek: 10, adp: 158.4, projectedPointsStd: 78.2, projectedPointsPpr: 112.4 },
  { name: 'Quentin Johnston', team: 'LAC', position: 'WR', byeWeek: 5, adp: 162.1, projectedPointsStd: 84.5, projectedPointsPpr: 112.4 },
  { name: 'Roman Wilson', team: 'PIT', position: 'WR', byeWeek: 9, adp: 165.2, projectedPointsStd: 82.1, projectedPointsPpr: 110.5 },
  { name: 'Ricky Pearsall', team: 'SF', position: 'WR', byeWeek: 9, adp: 146.4, projectedPointsStd: 88.5, projectedPointsPpr: 122.1 },
  { name: 'Jermaine Burton', team: 'CIN', position: 'WR', byeWeek: 7, adp: 150.2, projectedPointsStd: 88.1, projectedPointsPpr: 115.4 },
  { name: 'Troy Franklin', team: 'DEN', position: 'WR', byeWeek: 14, adp: 168.4, projectedPointsStd: 78.4, projectedPointsPpr: 105.4 },
  { name: 'Ricky Seals-Jones', team: 'FA', position: 'TE', byeWeek: 9, adp: 210.4, projectedPointsStd: 45.1, projectedPointsPpr: 68.2 },

  // --- ADDITIONAL TEs ---
  { name: 'Dallas Goedert', team: 'PHI', position: 'TE', byeWeek: 5, adp: 78.5, projectedPointsStd: 94.2, projectedPointsPpr: 138.4 },
  { name: 'Cole Kmet', team: 'CHI', position: 'TE', byeWeek: 7, adp: 96.4, projectedPointsStd: 92.1, projectedPointsPpr: 135.2 },
  { name: 'Dalton Schultz', team: 'HOU', position: 'TE', byeWeek: 14, adp: 98.1, projectedPointsStd: 91.5, projectedPointsPpr: 134.1 },
  { name: 'Pat Freiermuth', team: 'PIT', position: 'TE', byeWeek: 9, adp: 102.5, projectedPointsStd: 88.4, projectedPointsPpr: 128.5 },
  { name: 'Taysom Hill', team: 'NO', position: 'TE', byeWeek: 12, adp: 112.4, projectedPointsStd: 118.2, projectedPointsPpr: 132.4 },
  { name: 'Hunter Henry', team: 'NE', position: 'TE', byeWeek: 14, adp: 132.5, projectedPointsStd: 78.4, projectedPointsPpr: 112.4 },
  { name: 'Luke Musgrave', team: 'GB', position: 'TE', byeWeek: 10, adp: 118.2, projectedPointsStd: 84.1, projectedPointsPpr: 118.2 },
  { name: 'Tucker Kraft', team: 'GB', position: 'TE', byeWeek: 10, adp: 142.1, projectedPointsStd: 74.2, projectedPointsPpr: 108.4 },
  { name: 'Ben Sinnott', team: 'WAS', position: 'TE', byeWeek: 14, adp: 135.1, projectedPointsStd: 78.2, projectedPointsPpr: 112.5 },
  { name: 'Jonnu Smith', team: 'MIA', position: 'TE', byeWeek: 6, adp: 145.4, projectedPointsStd: 76.1, projectedPointsPpr: 112.4 },
  { name: 'Mike Gesicki', team: 'CIN', position: 'TE', byeWeek: 7, adp: 154.2, projectedPointsStd: 72.1, projectedPointsPpr: 105.4 },
  { name: 'Noah Fant', team: 'SEA', position: 'TE', byeWeek: 10, adp: 148.5, projectedPointsStd: 75.1, projectedPointsPpr: 108.5 },
  { name: 'Chig Okonkwo', team: 'TEN', position: 'TE', byeWeek: 5, adp: 152.1, projectedPointsStd: 74.5, projectedPointsPpr: 105.1 },
  { name: 'Tyler Conklin', team: 'NYJ', position: 'TE', byeWeek: 12, adp: 138.4, projectedPointsStd: 75.0, projectedPointsPpr: 115.2 },
  { name: 'Cade Otton', team: 'TB', position: 'TE', byeWeek: 11, adp: 130.2, projectedPointsStd: 78.4, projectedPointsPpr: 118.5 },
  { name: 'Juwan Johnson', team: 'NO', position: 'TE', byeWeek: 12, adp: 156.4, projectedPointsStd: 72.1, projectedPointsPpr: 98.4 },
  { name: 'Isaiah Likely', team: 'BAL', position: 'TE', byeWeek: 14, adp: 115.1, projectedPointsStd: 88.5, projectedPointsPpr: 122.4 },
  { name: 'Colby Parkinson', team: 'LAR', position: 'TE', byeWeek: 6, adp: 160.2, projectedPointsStd: 68.2, projectedPointsPpr: 95.1 },

  // --- ADDITIONAL KICKERS ---
  { name: 'Cameron Dicker', team: 'LAC', position: 'K', byeWeek: 5, adp: 162.4, projectedPointsStd: 131.0, projectedPointsPpr: 131.0 },
  { name: 'Cairo Santos', team: 'CHI', position: 'K', byeWeek: 7, adp: 165.2, projectedPointsStd: 128.0, projectedPointsPpr: 128.0 },
  { name: 'Chris Boswell', team: 'PIT', position: 'K', byeWeek: 9, adp: 168.1, projectedPointsStd: 126.0, projectedPointsPpr: 126.0 },
  { name: 'Matt Gay', team: 'IND', position: 'K', byeWeek: 14, adp: 171.5, projectedPointsStd: 125.0, projectedPointsPpr: 125.0 },
  { name: 'Chase McLaughlin', team: 'TB', position: 'K', byeWeek: 11, adp: 174.2, projectedPointsStd: 124.0, projectedPointsPpr: 124.0 },
  { name: 'Blake Grupe', team: 'NO', position: 'K', byeWeek: 12, adp: 176.5, projectedPointsStd: 122.0, projectedPointsPpr: 122.0 },
  { name: 'Greg Joseph', team: 'NYG', position: 'K', byeWeek: 11, adp: 178.4, projectedPointsStd: 120.0, projectedPointsPpr: 120.0 },
  { name: 'Anders Carlson', team: 'FA', position: 'K', byeWeek: 10, adp: 181.2, projectedPointsStd: 118.0, projectedPointsPpr: 118.0 },
  { name: 'Eddy Pineiro', team: 'CAR', position: 'K', byeWeek: 11, adp: 184.1, projectedPointsStd: 116.0, projectedPointsPpr: 116.0 },
  { name: 'Graham Gano', team: 'NYG', position: 'K', byeWeek: 11, adp: 186.2, projectedPointsStd: 114.0, projectedPointsPpr: 114.0 },

  // --- ADDITIONAL DEFENSES ---
  { name: 'Philadelphia Eagles', team: 'PHI', position: 'DST', byeWeek: 5, adp: 160.1, projectedPointsStd: 94.0, projectedPointsPpr: 94.0 },
  { name: 'Seattle Seahawks', team: 'SEA', position: 'DST', byeWeek: 10, adp: 163.5, projectedPointsStd: 92.0, projectedPointsPpr: 92.0 },
  { name: 'Jacksonville Jaguars', team: 'JAX', position: 'DST', byeWeek: 12, adp: 166.2, projectedPointsStd: 90.0, projectedPointsPpr: 90.0 },
  { name: 'Houston Texans', team: 'HOU', position: 'DST', byeWeek: 14, adp: 168.4, projectedPointsStd: 89.0, projectedPointsPpr: 89.0 },
  { name: 'Chicago Bears', team: 'CHI', position: 'DST', byeWeek: 7, adp: 152.2, projectedPointsStd: 95.0, projectedPointsPpr: 95.0 },
  { name: 'Las Vegas Raiders', team: 'LV', position: 'DST', byeWeek: 6, adp: 155.4, projectedPointsStd: 94.0, projectedPointsPpr: 94.0 },
  { name: 'Green Bay Packers', team: 'GB', position: 'DST', byeWeek: 10, adp: 158.1, projectedPointsStd: 93.0, projectedPointsPpr: 93.0 },
  { name: 'New Orleans Saints', team: 'NO', position: 'DST', byeWeek: 12, adp: 161.2, projectedPointsStd: 91.0, projectedPointsPpr: 91.0 },
  { name: 'Minnesota Vikings', team: 'MIN', position: 'DST', byeWeek: 6, adp: 172.5, projectedPointsStd: 86.0, projectedPointsPpr: 86.0 },
  { name: 'Indianapolis Colts', team: 'IND', position: 'DST', byeWeek: 14, adp: 175.4, projectedPointsStd: 85.0, projectedPointsPpr: 85.0 }
];

export function getFullPlayerPool(initialPlayers: DraftPlayer[]): DraftPlayer[] {
  const existingNamesAndPos = new Set(initialPlayers.map(p => `${p.name.toLowerCase()}_${p.position}`));
  
  const mappedAdditional: DraftPlayer[] = ADDITIONAL_PLAYERS_SHORT
    .filter(p => !existingNamesAndPos.has(`${p.name.toLowerCase()}_${p.position}`))
    .map((p, idx) => {
      const id = `additional_${idx + 1}`;
      return {
        id,
        name: p.name,
        team: p.team,
        position: p.position,
        byeWeek: p.byeWeek,
        adp: p.adp,
        projectedPointsStd: p.projectedPointsStd,
        projectedPointsPpr: p.projectedPointsPpr,
        isDrafted: false,
        draftedBy: null,
        rawMetrics: `Steady asset for ${p.team}. Expected depth or starting role in 2026. Prior year stats show stable usage with consistent snap rates.`,
        coachingChanges: `Stable coaching scheme. Position coordinator focusing on high efficiency operations.`,
        recentNews: `"Reported in excellent physical condition at training camp." "Coaching staff notes solid progression in system integration."`
      };
    });

  return [...initialPlayers, ...mappedAdditional];
}

export function assignTiers(playersList: DraftPlayer[]): DraftPlayer[] {
  // We calculate positional ranks for each position based on ADP (lower is better)
  const sorted = [...playersList].sort((a, b) => {
    const adpA = a.adp || 999;
    const adpB = b.adp || 999;
    if (adpA !== adpB) {
      return adpA - adpB;
    }
    // Tie breaker: higher projected points
    return b.projectedPointsPpr - a.projectedPointsPpr;
  });

  const counts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DST: 0 };

  return sorted.map(player => {
    const pos = player.position;
    counts[pos] = (counts[pos] || 0) + 1;
    const rank = counts[pos];
    let tier = 1;

    if (pos === 'QB') {
      if (rank <= 3) tier = 1;      // Elite (Josh Allen, Jalen Hurts, Patrick Mahomes)
      else if (rank <= 6) tier = 2;  // High End (Lamar Jackson, C.J. Stroud, Joe Burrow)
      else if (rank <= 10) tier = 3; // Mid Starters (Dak Prescott, Kyler Murray, Jordan Love)
      else if (rank <= 15) tier = 4; // Low Starters / Top Backups (Caleb Williams, Jayden Daniels, Trevor Lawrence)
      else if (rank <= 22) tier = 5; // Deep Backups / Streamers
      else tier = 6;                 // Flyers
    } else if (pos === 'RB') {
      if (rank <= 4) tier = 1;       // Elite Bellcows (McCaffrey, Bijan, Hall, Taylor)
      else if (rank <= 10) tier = 2; // High-End RB1s (Gibbs, Kyren Williams, Saquon Barkley, Etienne)
      else if (rank <= 18) tier = 3; // Quality RB2s (Derrick Henry, Pacheco, James Cook, Ken Walker)
      else if (rank <= 28) tier = 4; // Mid/Low RB2s & High-Upside Handcuffs (Zamir White, David Montgomery, James Conner)
      else if (rank <= 40) tier = 5; // Flex Options / Committee Backs (Mostert, Najee Harris, Tony Pollard)
      else if (rank <= 55) tier = 6; // Bench Depth / High Handcuffs
      else tier = 7;                 // Deep Speculative Options
    } else if (pos === 'WR') {
      if (rank <= 6) tier = 1;       // Elite WR1s (CeeDee, Jefferson, Tyreek, Chase, Amon-Ra, AJ Brown)
      else if (rank <= 14) tier = 2; // Quality WR1s / High-End WR2s (Puka Nacua, Garrett Wilson, Marvin Harrison Jr, Olave)
      else if (rank <= 25) tier = 3; // Solid WR2s (DeVonta Smith, Jaylen Waddle, Cooper Kupp, DK Metcalf, Nico Collins)
      else if (rank <= 40) tier = 4; // Quality WR3 / Flex Options (Tee Higgins, George Pickens, Terry McLaurin)
      else if (rank <= 55) tier = 5; // Bench Depth / Mid-Tier Flex (Rashee Rice, Christian Kirk, Calvin Ridley)
      else if (rank <= 75) tier = 6; // Deep Bench / Late-Round Sleepers
      else tier = 7;                 // Deep Flyers
    } else if (pos === 'TE') {
      if (rank <= 3) tier = 1;       // Elite TEs (Kelce, LaPorta, McBride)
      else if (rank <= 6) tier = 2;       // Quality Starters (Mark Andrews, Kincaid, Kittle)
      else if (rank <= 11) tier = 3;      // Streamers / Low End Starters (Kyle Pitts, Engram, Jake Ferguson, Njoku)
      else if (rank <= 16) tier = 4;      // Late Round Flyers (Brock Bowers, Dallas Goedert, Cole Kmet)
      else tier = 5;                      // Deep Backup TEs
    } else if (pos === 'K') {
      if (rank <= 4) tier = 1;       // Elite Kickers (Aubrey, Tucker, Butker)
      else if (rank <= 9) tier = 2;       // Stable Starters
      else tier = 3;                      // Matchup Streamers
    } else if (pos === 'DST') {
      if (rank <= 4) tier = 1;       // Elite DSTs (49ers, Ravens, Cowboys, Browns)
      else if (rank <= 9) tier = 2;       // Quality Defenses
      else tier = 3;                      // Streaming Defenses
    }

    return {
      ...player,
      tier
    };
  });
}

